import fs from 'fs';
import path from 'path';
import { getXFollowersStats } from './followers';
import { getTelegramStats } from './telegram';
import { getTokenStats } from './holders';
import { getStarsStats } from './github/stars';
import { getForksStats } from './github/forks';
import { getReleaseVersion } from './github/versions';
import { checkMilestones } from './milestone';
import { ParquetWriter } from 'parquetjs';
import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config();

// Output directories
const DATA_DIR = path.join(__dirname, '../public/data');
const PARQUET_DIR = path.join(DATA_DIR, 'parquet');

// Ensure directories exist
[DATA_DIR, PARQUET_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Schema definitions for Parquet
const followerSchema = {
  id: { type: 'INT64' },
  timestamp: { type: 'UTF8' },
  count: { type: 'INT64' },
  source: { type: 'UTF8' }
};

// Get current date for file naming
const getDateString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// Function to append data to Parquet file
async function appendToParquet(data: any[], schema: any, type: string) {
  try {
    const dateStr = getDateString();
    const filePath = path.join(PARQUET_DIR, `${type}_${dateStr}.parquet`);
    
    // Check if file exists
    const fileExists = fs.existsSync(filePath);
    
    // Create a new ParquetWriter or append to existing file
    const writer = await new ParquetWriter(filePath, schema, { append: fileExists });
    
    // Write the data
    for (const row of data) {
      await writer.appendRow(row);
    }
    
    // Close the writer
    await writer.close();
    
    console.log(`Successfully wrote ${data.length} records to ${filePath}`);
  } catch (error) {
    console.error(`Error writing to Parquet file for ${type}:`, error);
  }
}

// Function to run all data collectors
async function collectAllData() {
  try {
    console.log('Starting data collection...');
    const timestamp = new Date().toISOString();
    
    // Collect X followers
    const [xMessage, xCount] = await getXFollowersStats();
    console.log(xMessage);
    
    // Collect Telegram members
    const [telegramMessage, telegramCount] = await getTelegramStats();
    console.log(telegramMessage);
    
    // Collect token holders
    const [holdersMessage, holdersCount] = await getTokenStats();
    console.log(holdersMessage);
    
    // Collect GitHub stars
    const [starsMessage, starsData] = await getStarsStats();
    console.log(starsMessage);
    
    // Collect GitHub forks
    const [forksMessage, forksData] = await getForksStats();
    console.log(forksMessage);
    
    // Collect versions data
    const [versionsMessage, versionsData] = await getReleaseVersion();
    console.log(versionsMessage);
    
    // Check for milestones
    const xMilestones = checkMilestones('x_followers', xCount, [100, 500, 1000, 5000, 10000]);
    const telegramMilestones = checkMilestones('telegram_members', telegramCount, [100, 500, 1000, 5000, 10000]);
    const holdersMilestones = checkMilestones('token_holders', holdersCount, [100, 500, 1000, 5000, 10000]);
    const starsMilestones = checkMilestones('github_stars', starsData.current, [10, 50, 100, 500, 1000]);
    const forksMilestones = checkMilestones('github_forks', forksData.current, [10, 50, 100, 500, 1000]);
    
    // Prepare data for Parquet
    const socialData = [
      { id: Date.now(), timestamp, count: xCount, source: 'x' },
      { id: Date.now() + 1, timestamp, count: telegramCount, source: 'telegram' },
      { id: Date.now() + 2, timestamp, count: holdersCount, source: 'holders' },
      { id: Date.now() + 3, timestamp, count: starsData.current, source: 'github_stars' },
      { id: Date.now() + 4, timestamp, count: forksData.current, source: 'github_forks' }
    ];
    
    // Write to Parquet
    await appendToParquet(socialData, followerSchema, 'metrics');
    
    console.log('Data collection completed successfully!');
  } catch (error) {
    console.error('Error in data collection:', error);
  }
}

// Run once immediately on startup
collectAllData();

// Setup cron job to run every 12 hours
// This runs at 00:00 and 12:00 every day
cron.schedule('0 0,12 * * *', () => {
  console.log('Running scheduled data collection...');
  collectAllData();
});

console.log('Data collector initialized and scheduled to run every 12 hours'); 