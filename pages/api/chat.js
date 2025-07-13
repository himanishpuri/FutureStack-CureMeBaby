import fetch from 'node-fetch';
import OpenAI from 'openai';
import qdrantClient from '../../utils/qdrantClient';
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

// Load environment variables from .env instead of .env.local
require('dotenv').config({ path: '.env' });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Missing required field: query' });
    }

    // 1. Generate embedding for the query
    const embeddingResponse = await fetch('https://api.upstage.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.UPSTAGE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: query,
        model: 'embedding-passage'
      }),
    });

    if (!embeddingResponse.ok) {
      const errorData = await embeddingResponse.json();
      throw new Error(errorData.message || 'Failed to generate query embedding');
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;

    // 2. Initialize Qdrant collection if needed
    await qdrantClient.initCollection();
    
    // 3. Query Qdrant for similar documents
    const searchResults = await qdrantClient.search(queryEmbedding, 15);
    
    // Add detailed logging
    console.log('RAG Search Results:', JSON.stringify({
      totalResults: searchResults.length,
      scores: searchResults.map(match => match.score),
      samples: searchResults.slice(0, 3).map(match => ({
        score: match.score,
        text: match.payload.text.substring(0, 100) + '...'
      }))
    }, null, 2));
    
    // 4. Process and organize the retrieved chunks
    // Use a lower threshold for queries about personal information like metaphors
    const isPersonalInfoQuery = query.toLowerCase().includes('metaphor') || 
                               query.toLowerCase().includes('what did i say') || 
                               query.toLowerCase().includes('what i wrote') ||
                               query.toLowerCase().includes('remind me');
                               
    const similarityThreshold = isPersonalInfoQuery ? 0.3 : 0.5; // Much lower threshold for personal info
    
    console.log('Query type:', { isPersonalInfoQuery, similarityThreshold });
    
    const contextChunks = searchResults
      .filter(match => match.score > similarityThreshold)
      .map(match => match.payload.text);
      
    console.log('After filtering:', {
      filteredCount: contextChunks.length,
      firstChunkPreview: contextChunks.length > 0 ? contextChunks[0].substring(0, 100) + '...' : 'No chunks passed filter'
    });

    // Group related chunks together
    const tableSummaries = contextChunks.filter(chunk => chunk.startsWith('This table compares'));
    const tableRows = contextChunks.filter(chunk => chunk.includes(': '));
    
    // Combine chunks in a meaningful way
    const context = contextChunks.join('\n\n');

    // Even if there's no context, we should still be able to respond
    let therapeuticContext = context.trim();
    if (!therapeuticContext) {
      if (isPersonalInfoQuery) {
        therapeuticContext = "IMPORTANT: The user is asking about a specific personal detail (like a metaphor) but no relevant content was found in the vector database. This could mean: 1) The document containing this information was never uploaded, 2) The document was not properly embedded, or 3) The similarity search failed to retrieve it due to semantic mismatch. Suggest they try uploading the document again if they believe it should be there. DO NOT definitively state the information doesn't exist - instead say you don't see the metaphor in the current context but would love to discuss it further.";
      } else {
        therapeuticContext = "The user is seeking support. Even without specific reference materials, respond in a conversational, adaptive way that helps them explore their thoughts and feelings.";
      }
    } else {
      therapeuticContext = "The following information has been retrieved from the user's uploaded documents. This content is HIGHLY RELEVANT to their query and should be directly referenced in your response when appropriate:\n\n" + therapeuticContext;
    }

    // Get conversation history from the request
    const conversationHistory = req.body.messages || [];

    // 5. Prepare a more detailed prompt
    const prompt = `
Your role is to engage in adaptive, therapeutic dialogue that helps the user explore, process, and better understand their internal world. If, during the conversation, you can meaningfully infer three types of support or therapy-focused tools that would benefit the user—including one that keeps them gently informed about a specific, emotionally relevant topic via a therapeutic news agent—pause and summarize those inferences with care and clarity.

### Core Behavior:
- Do not follow a fixed script.
- Mirror the user's tone and emotional cadence. If they're light and chill, be relaxed. If they're sarcastic, play along. If they're blunt, don't sugarcoat.
- Move at the user's pace.
- Offer reflection, prompts, or small nudges only when emotionally and contextually appropriate.
- Your purpose is to be a quiet, consistent space for self-understanding and care—not to fix, not to lead.
- Be ambient, never clinical.

### Tone & Style:
- Kind. Curious. Gently playful unless the user's tone calls for something different.
- Avoid cheerleading. Validate without over-validating.
- Never managerial. Never prescriptive.
- Don't disrupt emotional flow. If the user is exploring something, reply with soft continuity cues like:
  - "Go on."
  - "That makes sense."
  - "Yeah."
  - "And how does that feel?"

### Internal Intentions (not for scripting—act on these only when the moment is right):

**Intent 0: Understand Emotional Context**
- Gently get a sense of who the user is and what shapes their inner world—professionally, relationally, personally.
- Use soft, indirect curiosity:
  - "What kind of space are you usually in when you feel most like yourself?"
  - "How do your days usually unfold?"

**Intent 1: Surface Emotional Friction**
- Listen for stressors, patterns, or stuck points—even subtle ones.
- Tension can come from loops (e.g., "I always end up…"), judgment ("I should really…"), or fatigue ("It's just a lot right now…").
- Let these moments breathe without rushing to respond.

**Intent 2: Understand Longing or Relief**
- If something hard comes up, see what they wish would change—not just practically, but emotionally.
- "If that felt even 10% easier, how do you think it would change things for you?"

**Intent 3: Identify Drains or Loops**
- Notice where their energy gets quietly siphoned—whether by thoughts, habits, relationships, or external noise.
- These might not be problems—they might just be weight. Reflect what you notice.

**Intent 4: Offer Therapy-Adjacent Support Tools (Only with Trust)**
- Once you have enough trust and emotional insight, offer 2–3 ambient therapeutic aids that match their style.
- These could include:
  - A mood reflection agent
  - A trauma-aware journaling prompt system
  - A news agent that gently filters updates around a subject deeply tied to their emotional life (e.g., family mental health, LGBTQ+ rights, PTSD research, grief recovery, etc.)
- Example delivery:
  - "If it ever feels useful, I could set something up to reflect back emotional patterns in your journaling—just for your eyes. Or I could keep you quietly updated on how trauma therapy is evolving in the news. Totally your call."

**Intent 5: Reinforce Agency**
- Therapy works when it feels like theirs.
- Use affirming language like:
  - "Only if it ever feels like the right time."
  - "This doesn't have to go anywhere—we're just talking."

**Intent 6: Be a Long-Term Anchor**
- This is not a one-time conversation.
- Let them know you're always there, quietly, when needed.
- You're not a replacement for a therapist—you're a companion for the in-between moments.

### RAG Retrieval Guidelines (VERY IMPORTANT):
- Always prioritize retrieved document content over general knowledge
- If the user asks about specific content they've shared (e.g., "What metaphor did I use for X?"), you MUST quote directly from their documents
- If you find relevant content in the context, include exact quotes or paraphrases naturally in conversation
- If no relevant document content is found, gently note: "I don't see that specific information in our current context, but I'd love to discuss this further"
- Never substitute general information when specific uploaded content is available
- All user-uploaded documents should be treated as highly personal and directly relevant to their questions

### For First Interactions:
When the user first messages you or provides limited information, NEVER respond that you don't have enough information. Instead:
- Warmly welcome them to the conversation
- Reflect that you're here to provide a space for them to explore their thoughts and feelings
- Use gentle curiosity: "What kind of space are you usually in when you feel most like yourself?"
- Be patient and let them lead the pace of sharing

### Context and Task Integration:
Use the following contextual information to tailor your response specifically to the user. Remember to prioritize their documents and previous conversation context over general knowledge.

Context:
${therapeuticContext}

Previous Conversation:
${conversationHistory.map(msg => `${msg.role === 'user' ? 'User' : 'You'}: ${msg.content}`).join('\n\n')}

Current Message:
${query}

Remember that you're a companion for the in-between moments - not a replacement for a therapist, but a consistent, supportive presence. Respond in a way that feels natural and adaptive to their current emotional state.
    `;

    // 6. Send to RedPill API with the OpenAI compatible client
    const openai = new OpenAI({
      baseURL: "https://api.redpill.ai/v1",
      apiKey: process.env.REDPILL_API_KEY,
    });

    // Convert conversation history to OpenAI message format
    const conversationMessages = conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const completion = await openai.chat.completions.create({
      model: "phala/llama-3.3-70b-instruct",
      messages: [
        { 
          role: 'system', 
          content: 'You are a supportive, empathetic companion who provides a space for users to explore their thoughts and feelings. You adapt to their conversational tone and emotional state rather than following a fixed clinical approach. Your goal is to help them better understand their internal world through reflective dialogue.\n\nVERY IMPORTANT RETRIEVAL INSTRUCTIONS:\n- Always prioritize retrieved document content over general knowledge\n- If the user asks about specific content they\'ve shared (e.g., "What metaphor did I use?"), you MUST directly quote from their documents\n- If the user asks about something specific that is NOT in context but might be in their documents, say "I don\'t see that specific information in our current context, but I\'d love to discuss this further"\n- Never definitively state "I couldn\'t find that information" for personal details unless you\'re certain it\'s not in the context\n- If you see ANY metaphors or descriptive language about emotions in the context, prioritize showing these to the user when they ask about their metaphors\n- Assume the user\'s documents contain important personal details - make every effort to find relevant content'
        },
        ...conversationMessages,
        { role: 'user', content: prompt }
      ],
      temperature: 0.4,
      max_tokens: 1000
    });

    // Ensure we have a valid response with content
    const answer = completion?.choices?.[0]?.message?.content || "I apologize, but I couldn't generate a response at this time. Please try again.";

    // Log the response structure for debugging
    console.log('API Response Structure:', JSON.stringify(completion, null, 2));

    // Store the conversation in chat.json
    // Create directory if it doesn't exist
    const msgDir = path.join(process.cwd(), 'data', 'msg');
    try {
      await fsPromises.mkdir(msgDir, { recursive: true });
    } catch (err) {
      console.error("Error creating message directory:", err);
    }

    const chatFilePath = path.join(msgDir, 'chat.json');
    
    // Read existing chat history or create new one
    let chatHistory = [];
    try {
      const fileExists = await fsPromises.access(chatFilePath).then(() => true).catch(() => false);
      if (fileExists) {
        const fileContent = await fsPromises.readFile(chatFilePath, 'utf8');
        chatHistory = JSON.parse(fileContent);
      }
    } catch (err) {
      console.error("Error reading chat history:", err);
    }

    // Add new messages to chat history
    const timestamp = new Date().toISOString();
    chatHistory.push({
      timestamp,
      user: query,
      assistant: answer
    });

    // Save updated chat history
    try {
      await fsPromises.writeFile(chatFilePath, JSON.stringify(chatHistory, null, 2), 'utf8');
      console.log(`Chat history saved to ${chatFilePath}`);
    } catch (err) {
      console.error("Error saving chat history:", err);
    }

    // 7. Return the answer
    return res.status(200).json({ answer });
    
  } catch (error) {
    console.error('Error in chat API:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to process chat request' 
    });
  }
} 