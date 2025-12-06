const fs = require('fs');  // Import fs module for filesystem operations
const path = require('path');  // Import path module for path manipulation
const fileDB = require('./file');
const recordUtils = require('./record');
const vaultEvents = require('../events');

function addRecord({ name, value }) {
  recordUtils.validateRecord({ name, value });
  const data = fileDB.readDB();
  const newRecord = { id: recordUtils.generateId(), name, value, createdAt: new Date().toISOString()};
  data.push(newRecord);
  fileDB.writeDB(data);
  // ✅ Automatic backup after adding
  fileDB.backupDB(data);
  vaultEvents.emit('recordAdded', newRecord);
  return newRecord;
}

function listRecords() {
  return fileDB.readDB();
}

function updateRecord(id, newName, newValue) {
  const data = fileDB.readDB();
  const record = data.find(r => r.id === id);
  if (!record) return null;
  record.name = newName;
  record.value = newValue;
  fileDB.writeDB(data);
  vaultEvents.emit('recordUpdated', record);
  return record;
}

function deleteRecord(id) {
  let data = fileDB.readDB();
  const record = data.find(r => r.id === id);
  if (!record) return null;
  data = data.filter(r => r.id !== id);
  fileDB.writeDB(data);
  // ✅ Automatic backup after deleting
  fileDB.backupDB(data);
  vaultEvents.emit('recordDeleted', record);
  return record;
}

function getVaultStats() {
    const data = fileDB.readDB();

    if (data.length === 0) {
        return {
            totalRecords: 0,
            lastModified: 'N/A',
            longestName: 'N/A',
            longestNameLength: 0,
            earliestRecord: 'N/A',
            latestRecord: 'N/A'
        };
    }

    const totalRecords = data.length;

    // Last modified time of the vault.json
    const vaultFile = path.join(__dirname, '..', 'data', 'vault.json');
    const stats = fs.statSync(vaultFile);
    const lastModified = stats.mtime.toISOString().replace('T', ' ').split('.')[0];

    // Longest name
    let longestName = '';
    data.forEach(r => {
        if (r.name.length > longestName.length) longestName = r.name;
    });

    // Earliest and latest creation dates
    const creationDates = data.map(r => new Date(r.createdAt));
    const earliestRecord = new Date(Math.min(...creationDates)).toISOString().split('T')[0];
    const latestRecord = new Date(Math.max(...creationDates)).toISOString().split('T')[0];

    return {
        totalRecords,
        lastModified,
        longestName,
        longestNameLength: longestName.length,
        earliestRecord,
        latestRecord
    };
}

module.exports = { addRecord, listRecords, updateRecord, deleteRecord, getVaultStats };



