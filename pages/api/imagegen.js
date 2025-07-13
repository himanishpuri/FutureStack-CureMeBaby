// pages/api/imagegen.js
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import OpenAI from 'openai';

export default async function handler(req, res) {
  try {
    // Read the chat.json file to understand user's situation
    const msgDir = path.join(process.cwd(), 'data', 'msg');
    const chatFilePath = path.join(msgDir, 'chat.json');
    
    let chatHistory = [];
    try {
      const fileExists = await fsPromises.access(chatFilePath).then(() => true).catch(() => false);
      if (fileExists) {
        const fileContent = await fsPromises.readFile(chatFilePath, 'utf8');
        chatHistory = JSON.parse(fileContent);
      }
    } catch (err) {
      console.error("Error reading chat history:", err);
      return res.status(500).json({ error: "Failed to read chat history" });
    }

    if (chatHistory.length === 0) {
      return res.status(400).json({ error: "No chat history found" });
    }

    // Format the chat history for the summary generation
    const chatFormatted = chatHistory.map(msg => 
      `User: ${msg.user}\nAssistant: ${msg.assistant}`
    ).join('\n\n');

    // Generate a summary using Llama 3.3 70B model
    const openai = new OpenAI({
      apiKey: process.env.REDPILL_API_KEY,
      baseURL: "https://api.redpill.ai/v1",
    });

    const summaryPrompt = `
Below is a conversation between a user and an AI assistant.
Please create a brief, empathetic summary (2-3 sentences) of the user's current emotional state and situation.
Focus on their feelings and what they're going through right now.
This summary will be used to generate a supportive image for them.
Use a 2nd person pov, as if you are talking to the user, so just use "you" and "your" instead of "user" and "user's". 

Conversation:
${chatFormatted}

Summary:`;

    const summary = await openai.chat.completions.create({
      model: "phala/llama-3.3-70b-instruct",
      messages: [
        { role: 'user', content: summaryPrompt }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    const summaryText = summary.choices[0].message.content.trim();
    console.log("Generated summary:", summaryText);

    // Define the DALL-E prompt template directly in the code
    const prompt = `Anime-style illustration of young Asian male with black bowl cut, green hoodie, blue shirt. Scenario: ${summaryText}

Character details: Male with bowl haircut, friendly expression. Pose and emotions should match scenario.

Scene must include all objects mentioned in scenario. Background elements must support the scenario context with vibrant colors and clear composition.

Important: Show exactly what's happening in the scenario (e.g., if "dropping cake", show the cake falling/fallen). Must include something from the scenario, and the character`;
  
    // Generate image with DALL-E
    const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "dall-e-2",
        prompt,
        n: 1,
        size: "512x512",
        response_format: "url",
        quality: "hd",
      }),
    });
  
    const data = await imageResponse.json();
    console.log("OpenAI API Response:", JSON.stringify(data));
    
    if (data.error) {
      console.error("OpenAI API Error:", data.error);
      return res.status(500).json({ error: data.error.message || "Image generation failed" });
    }
    
    if (!data.data || !data.data[0] || !data.data[0].url) {
      console.error("Unexpected API response structure:", data);
      return res.status(500).json({ error: "Invalid response from image generation API" });
    }
    
    const imageUrl = data.data[0].url;
    
    // Create directory if it doesn't exist
    const imgDir = path.join(process.cwd(), 'data', 'img');
    try {
      await fsPromises.mkdir(imgDir, { recursive: true });
    } catch (err) {
      console.error("Error creating directory:", err);
    }
    
    // Get the next image index
    let nextIndex = 1;
    try {
      const files = await fsPromises.readdir(imgDir);
      const pngFiles = files.filter(file => file.endsWith('.png'));
      if (pngFiles.length > 0) {
        const indices = pngFiles
          .map(file => parseInt(file.replace(/[^0-9]/g, ''), 10))
          .filter(num => !isNaN(num));
        if (indices.length > 0) {
          nextIndex = Math.max(...indices) + 1;
        }
      }
    } catch (err) {
      console.error("Error reading directory:", err);
    }
    
    // Download and save the image
    const imagePath = path.join(imgDir, `${nextIndex}.png`);
    try {
      const imageDataResponse = await fetch(imageUrl);
      const arrayBuffer = await imageDataResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await fsPromises.writeFile(imagePath, buffer);
      console.log(`Image saved to ${imagePath}`);
    } catch (err) {
      console.error("Error saving image:", err);
    }
    
    res.status(200).json({ 
      summary: summaryText,
      image: imageUrl,
      savedPath: `/data/img/${nextIndex}.png`
    });
  } catch (err) {
    console.error("Exception during processing:", err);
    res.status(500).json({ error: "Process failed: " + (err.message || "Unknown error") });
  }
}