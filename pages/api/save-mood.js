import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { mood, date } = req.body;
    
    if (!mood || !date) {
      return res.status(400).json({ error: 'Missing required fields: mood and date' });
    }

    // Ensure the mood data directory exists
    const moodDir = path.join(process.cwd(), 'data', 'mood');
    await fs.mkdir(moodDir, { recursive: true });

    // Load existing mood data or create new array
    const moodFilePath = path.join(moodDir, 'mood-data.json');
    let moodData = [];
    
    try {
      const fileExists = await fs.access(moodFilePath).then(() => true).catch(() => false);
      if (fileExists) {
        const fileContent = await fs.readFile(moodFilePath, 'utf8');
        moodData = JSON.parse(fileContent);
      }
    } catch (error) {
      console.error('Error reading mood data file:', error);
    }

    // Check if there's already an entry for today's date
    const todayEntry = moodData.find(entry => entry.date === date);
    
    if (todayEntry) {
      // Update existing entry
      todayEntry.mood = mood;
    } else {
      // Add new entry
      moodData.push({
        date,
        mood,
        timestamp: new Date().toISOString()
      });
    }

    // Save the updated mood data
    await fs.writeFile(moodFilePath, JSON.stringify(moodData, null, 2), 'utf8');
    
    console.log(`Mood saved for ${date}: ${mood}`);
    
    return res.status(200).json({ success: true, message: 'Mood saved successfully' });
  } catch (error) {
    console.error('Error saving mood:', error);
    return res.status(500).json({ error: 'Failed to save mood data' });
  }
} 