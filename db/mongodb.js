const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB_NAME;
let client;
let db;

async function connectDB() {
    try {
        client = new MongoClient(uri);
        await client.connect();
        db = client.db(dbName);
        console.log('✅ Connected to MongoDB');
        return db;
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
}

async function getDB() {
    if (!db) {
        await connectDB();
    }
    return db;
}

module.exports = { connectDB, getDB, ObjectId };
