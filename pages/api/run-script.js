import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import OpenAI from 'openai';

const execPromise = promisify(exec);

// Function to call Phala's Llama 3.3 70B model
async function analyzeTherapeticContent(content) {
  try {
    // Check if API key is defined
    const apiKey = process.env.REDPILL_API_KEY;
    if (!apiKey) {
      console.error("REDPILL_API_KEY environment variable is not set");
      return "Could not generate AI improvement suggestions. API key is missing.";
    }
    
    // Initialize the OpenAI client with Phala/RedPill endpoint
    const openai = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://api.redpill.ai/v1",
      defaultHeaders: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });
    
    // Call the model using direct fetch instead of OpenAI client if needed
    console.log("Calling Phala API with key:", apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length - 4));
    
    try {
      // First try with OpenAI client
      const completion = await openai.chat.completions.create({
        model: "phala/llama-3.3-70b-instruct",
        messages: [
          {
            role: 'system',
            content: 'You are an expert mental health therapy supervisor. Your task is to evaluate the therapeutic conversations and provide specific, actionable feedback on how the AI therapist can improve its responses. Focus on therapeutic techniques, empathy, clarity, and practical guidance.'
          },
          {
            role: 'user',
            content: `Please review the following therapy session output and provide 3-5 specific, actionable suggestions for how the AI therapist can improve its responses. Be concise and practical.\n\nTherapy Session Content:\n${content.substring(0, 10000)}` // Limit to 10K characters for context window
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });
      
      // Extract the response content
      return completion?.choices?.[0]?.message?.content || "Could not generate AI improvement suggestions.";
    } catch (clientError) {
      console.error("OpenAI client error:", clientError);
      
      // Fall back to direct fetch if OpenAI client fails
      const response = await fetch("https://api.redpill.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "phala/llama-3.3-70b-instruct",
          "messages": [
            {
              "role": "system",
              "content": "You are an expert mental health therapy supervisor. Your task is to evaluate the therapeutic conversations and provide specific, actionable feedback on how the AI therapist can improve its responses. Focus on therapeutic techniques, empathy, clarity, and practical guidance."
            },
            {
              "role": "user",
              "content": `Please review the following therapy session output and provide 3-5 specific, actionable suggestions for how the AI therapist can improve its responses. Be concise and practical.\n\nTherapy Session Content:\n${content.substring(0, 10000)}`
            }
          ],
          "temperature": 0.7,
          "max_tokens": 500
        })
      });
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "Could not generate AI improvement suggestions.";
    }
  } catch (error) {
    console.error("Error calling LLM API:", error);
    return "Could not generate AI improvement suggestions due to an error. Please check your API key and try again.";
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Get the absolute path to the run.sh script
    const rootDir = process.cwd();
    const scriptPath = path.join(rootDir, 'run.sh');
    
    console.log(`Executing script at: ${scriptPath}`);
    
    // Execute the run.sh script with appropriate permissions
    const { stdout, stderr } = await execPromise(`bash ${scriptPath}`, {
      timeout: 300000, // 5 minute timeout
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    });
    
    // Log any stderr output for debugging
    if (stderr) {
      console.log('Script stderr output:', stderr);
    }

    // Log success for debugging
    console.log('Script executed successfully');
    
    // Read the content of the supervisor_content.txt file
    let aiSuggestions = "No suggestions available.";
    try {
      // Path to the supervisor_content.txt file (adjust if needed)
      const contentPath = path.join(rootDir, 'rl-swarm', 'supervisor_content.txt');
      
      // Check if file exists
      await fs.access(contentPath);
      
      // Read the file
      const content = await fs.readFile(contentPath, 'utf8');
      
      // Call LLM to analyze and provide suggestions
      console.log('Analyzing therapeutic content with LLM...');
      aiSuggestions = await analyzeTherapeticContent(content);
      console.log('LLM analysis complete');
    } catch (fileError) {
      console.error('Error reading or analyzing supervisor_content.txt:', fileError);
      aiSuggestions = "Could not generate suggestions. The analysis file was not found or could not be processed.";
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'AI model evaluation and improvement complete',
      output: stdout.substring(0, 1000), // Limit output size
      aiSuggestions: aiSuggestions
    });
  } catch (error) {
    console.error('Error executing script:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'An unknown error occurred'
    });
  }
} 