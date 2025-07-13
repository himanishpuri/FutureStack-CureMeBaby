import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Path to the mood data file
    const moodFilePath = path.join(process.cwd(), 'data', 'mood', 'mood-data.json');
    
    // Check if the file exists
    let hasSelectedToday = false;
    
    try {
      const fileExists = await fs.access(moodFilePath).then(() => true).catch(() => false);
      
      if (fileExists) {
        // Read and parse the file
        const fileContent = await fs.readFile(moodFilePath, 'utf8');
        const moodData = JSON.parse(fileContent);
        
        // Check if there's an entry for today
        hasSelectedToday = moodData.some(entry => entry.date === today);
      }
    } catch (error) {
      console.error('Error checking mood data:', error);
      // If there's an error reading the file, assume the user hasn't selected a mood
    }
    
    return res.status(200).json({ 
      hasSelectedToday,
      today
    });
  } catch (error) {
    console.error('Error in check-mood-today API:', error);
    return res.status(500).json({ error: 'Failed to check mood data' });
  }
} 