const fs = require('fs');
const path = require('path');
const mongoClient = require('./mongo'); // Add this import

const backupDir = path.join(__dirname, '..', 'backups');

if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Keep existing file operations if needed for migration
const dataDir = path.join(__dirname, '..', 'data');
const dbFile = path.join(dataDir, 'vault.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

function readDB() {
  if (!fs.existsSync(dbFile)) {
    return [];
  }
  const data = fs.readFileSync(dbFile, 'utf8');
  return JSON.parse(data);
}

function writeDB(data) {
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
}

// Updated backup function for MongoDB
async function backupDB() {
  try {
    const db = await mongoClient.getDB();
    const collection = db.collection('records');
    const data = await collection.find({}).toArray();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `backup_${timestamp}.json`);
    
    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
    console.log(`✅ Backup created: ${backupFile}`);
    return backupFile;
  } catch (error) {
    console.error('❌ Backup failed:', error);
    return null;
  }
}

module.exports = { readDB, writeDB, backupDB };
