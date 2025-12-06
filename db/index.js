const { ObjectId } = require('mongodb');
const mongoClient = require('./mongo'); // We'll create this
const vaultEvents = require('../events');

async function addRecord({ name, value }) {
  try {
    // Validate the record
    if (!name || !value) {
      throw new Error('Record must have both name and value.');
    }

    const db = await mongoClient.getDB();
    const collection = db.collection('records');
    
    const newRecord = { 
      name, 
      value, 
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await collection.insertOne(newRecord);
    newRecord._id = result.insertedId;
    
    // ✅ Emit event for logging
    vaultEvents.emit('recordAdded', newRecord);
    
    return newRecord;
  } catch (error) {
    console.error('Error adding record:', error);
    throw error;
  }
}

async function listRecords() {
  try {
    const db = await mongoClient.getDB();
    const collection = db.collection('records');
    return await collection.find({}).toArray();
  } catch (error) {
    console.error('Error listing records:', error);
    return [];
  }
}

async function updateRecord(id, newName, newValue) {
  try {
    // Validate input
    if (!newName || !newValue) {
      throw new Error('Name and value are required for update.');
    }

    const db = await mongoClient.getDB();
    const collection = db.collection('records');
    
    // Convert string ID to ObjectId
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      throw new Error('Invalid record ID format');
    }
    
    const updateData = {
      name: newName,
      value: newValue,
      updatedAt: new Date()
    };
    
    const result = await collection.updateOne(
      { _id: objectId },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return null;
    }
    
    // Get the updated record
    const updatedRecord = await collection.findOne({ _id: objectId });
    
    // ✅ Emit event for logging
    vaultEvents.emit('recordUpdated', updatedRecord);
    
    return updatedRecord;
  } catch (error) {
    console.error('Error updating record:', error);
    throw error;
  }
}

async function deleteRecord(id) {
  try {
    const db = await mongoClient.getDB();
    const collection = db.collection('records');
    
    // Convert string ID to ObjectId
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (error) {
      throw new Error('Invalid record ID format');
    }
    
    // Get the record first (for event emission)
    const record = await collection.findOne({ _id: objectId });
    if (!record) {
      return null;
    }
    
    const result = await collection.deleteOne({ _id: objectId });
    
    if (result.deletedCount === 0) {
      return null;
    }
    
    // ✅ Emit event for logging
    vaultEvents.emit('recordDeleted', record);
    
    return record;
  } catch (error) {
    console.error('Error deleting record:', error);
    throw error;
  }
}

async function getVaultStats() {
  try {
    const db = await mongoClient.getDB();
    const collection = db.collection('records');
    
    const records = await collection.find({}).toArray();
    
    if (records.length === 0) {
      return {
        totalRecords: 0,
        lastModified: 'N/A',
        longestName: 'N/A',
        longestNameLength: 0,
        earliestRecord: 'N/A',
        latestRecord: 'N/A'
      };
    }

    const totalRecords = records.length;

    // Find longest name
    let longestName = '';
    records.forEach(r => {
      if (r.name.length > longestName.length) longestName = r.name;
    });

    // Find earliest and latest creation dates
    const creationDates = records.map(r => new Date(r.createdAt));
    const earliestDate = new Date(Math.min(...creationDates));
    const latestDate = new Date(Math.max(...creationDates));

    // Find last modified (most recent updatedAt)
    const modifiedDates = records.map(r => r.updatedAt ? new Date(r.updatedAt) : new Date(r.createdAt));
    const lastModified = new Date(Math.max(...modifiedDates)).toISOString().replace('T', ' ').split('.')[0];

    return {
      totalRecords,
      lastModified,
      longestName,
      longestNameLength: longestName.length,
      earliestRecord: earliestDate.toISOString().split('T')[0],
      latestRecord: latestDate.toISOString().split('T')[0]
    };
  } catch (error) {
    console.error('Error getting vault stats:', error);
    return {
      totalRecords: 0,
      lastModified: 'Error',
      longestName: 'Error',
      longestNameLength: 0,
      earliestRecord: 'Error',
      latestRecord: 'Error'
    };
  }
}

// Export all functions
module.exports = { 
  addRecord, 
  listRecords, 
  updateRecord, 
  deleteRecord, 
  getVaultStats 
};
