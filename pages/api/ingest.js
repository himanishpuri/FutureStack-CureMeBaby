import { parse } from 'node-html-parser';
import fetch from 'node-fetch';
import qdrantClient from '../../utils/qdrantClient';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { documentId, htmlContent } = req.body;

    if (!documentId || !htmlContent) {
      return res.status(400).json({ error: 'Missing required fields: documentId and htmlContent' });
    }

    // Parse HTML and extract text chunks
    const root = parse(htmlContent);
    const elements = root.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li, td, th, pre, blockquote, table');
    
    // Extract text from elements and filter out empty strings
    const chunks = elements
      .map(el => {
        // Special handling for table elements
        if (el.tagName.toLowerCase() === 'table') {
          const chunks = [];
          const rows = el.querySelectorAll('tr');
          
          // Get headers
          const headerRow = rows[0];
          const headers = headerRow ? Array.from(headerRow.querySelectorAll('th, td')).map(cell => cell.text.trim()) : [];
          
          // Process each row
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const cells = Array.from(row.querySelectorAll('td, th')).map(cell => cell.text.trim());
            
            // Create semantic chunks for each cell with its header
            cells.forEach((cell, idx) => {
              if (cell && headers[idx]) {
                chunks.push({
                  text: `${headers[idx]}: ${cell}`,
                  tag: 'table-cell'
                });
              }
            });
            
            // Also create a complete row chunk for context
            if (cells.length > 0) {
              const rowText = headers.map((header, idx) => `${header}: ${cells[idx] || ''}`).join('. ');
              chunks.push({
                text: rowText,
                tag: 'table-row'
              });
            }
          }
          
          // Add a summary chunk for the whole table
          if (headers.length > 0) {
            chunks.push({
              text: `This table compares the following aspects: ${headers.join(', ')}`,
              tag: 'table-summary'
            });
          }
          
          return chunks;
        }
        
        // Add source document ID and classification to each chunk's metadata
        const text = el.text.trim();
        // Skip empty chunks
        if (!text) return null;
        
        return [{
          text: text,
          tag: el.tagName.toLowerCase(),
          source: 'user-document',
          document_id: documentId,
          timestamp: new Date().toISOString()
        }];
      })
      .flat()
      .filter(chunk => chunk !== null && chunk.text && chunk.text.length > 0);

    // Create semantic chunks for better retrieval
    // Combine paragraphs that are too short (<40 chars) with the next paragraph
    const semanticChunks = [];
    let currentChunk = null;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      if (!currentChunk) {
        currentChunk = { ...chunk };
        continue;
      }
      
      // If current chunk is short, combine it with the next one
      if (currentChunk.text.length < 40 && i < chunks.length - 1) {
        currentChunk.text += "\n" + chunk.text;
        currentChunk.tag += "+" + chunk.tag;
      } else {
        semanticChunks.push(currentChunk);
        currentChunk = { ...chunk };
      }
    }
    
    // Add the last chunk if it exists
    if (currentChunk) {
      semanticChunks.push(currentChunk);
    }
    
    if (semanticChunks.length === 0) {
      return res.status(400).json({ error: 'No text content found in HTML' });
    }

    // Generate embeddings in batches of 100
    const batchSize = 100;
    const allEmbeddings = [];
    
    for (let i = 0; i < semanticChunks.length; i += batchSize) {
      const batchChunks = semanticChunks.slice(i, i + batchSize).map(chunk => chunk.text);
      
      const response = await fetch('https://api.upstage.ai/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.UPSTAGE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: batchChunks,
          model: 'embedding-passage'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate embeddings');
      }

      const data = await response.json();
      allEmbeddings.push(...data.data);
    }

    // Initialize Qdrant collection
    await qdrantClient.initCollection();

    // Prepare vectors with improved metadata
    const vectors = allEmbeddings.map((embedding, idx) => {
      // Generate a UUID-like ID for each vector
      const id = crypto.createHash('md5').update(`${documentId}_${idx}`).digest('hex');
      
      return {
        id: id,
        vector: embedding.embedding,
        payload: {
          text: semanticChunks[idx].text,
          tag: semanticChunks[idx].tag,
          doc_id: documentId,
          source: semanticChunks[idx].source || 'user-document',
          chunk_index: idx,
          timestamp: new Date().toISOString()
        }
      };
    });

    // Initialize upsert results
    let upsertResults = [];

    // Upsert vectors to Qdrant in batches
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batchVectors = vectors.slice(i, i + batchSize);
      const result = await qdrantClient.upsertVectors(batchVectors);
      upsertResults.push(result);
    }

    // Wait briefly for eventual consistency
    await new Promise(resolve => setTimeout(resolve, 1000));

    return res.status(200).json({ 
      success: true, 
      chunksProcessed: semanticChunks.length,
      results: upsertResults
    });
  } catch (error) {
    console.error('Error ingesting document:', error);
    return res.status(500).json({ 
      error: error.message || 'Failed to ingest document' 
    });
  }
} 