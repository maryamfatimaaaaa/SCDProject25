const { MongoClient } = require('mongodb');
require('dotenv').config(); // Load environment variables

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.MONGO_DB_NAME || 'nodevault';

let client;
let db;

async function connectDB() {
  try {
    if (!client) {
      client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000
      });
      await client.connect();
      db = client.db(dbName);
      console.log('✅ Connected to MongoDB successfully');
    }
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
}

async function getDB() {
  if (!db) {
    await connectDB();
  }
  return db;
}

// Graceful shutdown
process.on('SIGINT', async () => {
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  }
});

module.exports = { connectDB, getDB };
