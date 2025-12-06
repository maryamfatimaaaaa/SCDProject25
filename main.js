require('dotenv').config(); // Load environment variables
const readline = require('readline');
const db = require('./db');
const { connectDB } = require('./db/mongo'); // Import MongoDB connection
const fileDB = require('./db/file');
require('./events/logger'); // Initialize event logger

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Initialize MongoDB connection
async function initialize() {
  try {
    await connectDB();
    console.log('✅ MongoDB connected successfully');
    menu();
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    rl.close();
  }
}

function menu() {
  console.log(`
===== NodeVault =====
1. Add Record
2. List Records
3. Update Record
4. Delete Record
5. Exit
6. Search Records
7. Sort Records
8. Export Data
9. View Vault Status
=====================
  `);

  rl.question('Choose option: ', async ans => {
    switch (ans.trim()) {
      case '1':
        rl.question('Enter name: ', async name => {
          rl.question('Enter value: ', async value => {
            try {
              const newRecord = await db.addRecord({ name, value });
              console.log('✅ Record added successfully!');
              console.log(`Record ID: ${newRecord._id}`);
              
              // Create backup
              await fileDB.backupDB();
              menu();
            } catch (error) {
              console.error('❌ Error adding record:', error.message);
              menu();
            }
          });
        });
        break;

      case '2':
        try {
          const records = await db.listRecords();
          if (records.length === 0) {
            console.log('No records found.');
          } else {
            console.log(`Total records: ${records.length}`);
            records.forEach(r => {
              console.log(`ID: ${r._id} | Name: ${r.name} | Value: ${r.value} | Created: ${new Date(r.createdAt).toLocaleDateString()}`);
            });
          }
          menu();
        } catch (error) {
          console.error('❌ Error listing records:', error.message);
          menu();
        }
        break;

      case '3':
        rl.question('Enter record ID to update: ', async id => {
          rl.question('New name: ', async name => {
            rl.question('New value: ', async value => {
              try {
                const updated = await db.updateRecord(id, name, value);
                if (updated) {
                  console.log('✅ Record updated!');
                  // Create backup
                  await fileDB.backupDB();
                } else {
                  console.log('❌ Record not found.');
                }
                menu();
              } catch (error) {
                console.error('❌ Error updating record:', error.message);
                menu();
              }
            });
          });
        });
        break;

      case '4':
        rl.question('Enter record ID to delete: ', async id => {
          try {
            const deleted = await db.deleteRecord(id);
            if (deleted) {
              console.log('🗑️ Record deleted!');
              // Create backup
              await fileDB.backupDB();
            } else {
              console.log('❌ Record not found.');
            }
            menu();
          } catch (error) {
            console.error('❌ Error deleting record:', error.message);
            menu();
          }
        });
        break;

      case '5':
        console.log('👋 Exiting NodeVault...');
        rl.close();
        process.exit(0);
        break;

      case '6':
        rl.question('Enter search keyword (name or value): ', async keyword => {
          try {
            // Since we don't have a search function in db yet, we'll filter from list
            const all = await db.listRecords();
            const results = all.filter(r => 
              r.name.toLowerCase().includes(keyword.toLowerCase()) ||
              r.value.toLowerCase().includes(keyword.toLowerCase()) ||
              r._id.toString().includes(keyword)
            );

            if (results.length === 0) {
              console.log('No matching records found.');
            } else {
              console.log(`Found ${results.length} result(s):`);
              results.forEach(r => {
                console.log(`ID: ${r._id} | Name: ${r.name} | Value: ${r.value}`);
              });
            }
            menu();
          } catch (error) {
            console.error('❌ Error searching records:', error.message);
            menu();
          }
        });
        break;

      case '7':
        console.log("Sort By:");
        console.log("1. Name");
        console.log("2. Creation Date");

        rl.question("Choose field (1 or 2): ", async field => {
          rl.question("Order (asc/desc): ", async order => {
            try {
              const records = await db.listRecords();

              if (records.length === 0) {
                console.log("No records to sort.");
                return menu();
              }

              let sorted = [...records]; // clone array

              // Sort by Name
              if (field === '1') {
                sorted.sort((a, b) => {
                  if (order === 'desc')
                    return b.name.localeCompare(a.name);
                  else
                    return a.name.localeCompare(b.name);
                });
              }
              // Sort by Creation Date
              else if (field === '2') {
                sorted.sort((a, b) => {
                  const d1 = new Date(a.createdAt);
                  const d2 = new Date(b.createdAt);
                  return order === 'desc' ? d2 - d1 : d1 - d2;
                });
              } else {
                console.log("Invalid field!");
                return menu();
              }

              console.log("\nSorted Records:");
              sorted.forEach(r => {
                console.log(`ID: ${r._id} | Name: ${r.name} | Created: ${new Date(r.createdAt).toLocaleDateString()}`);
              });

              menu();
            } catch (error) {
              console.error('❌ Error sorting records:', error.message);
              menu();
            }
          });
        });
        break;

      case '8':
        const fs = require('fs');
        try {
          const allRecords = await db.listRecords();
          if (allRecords.length === 0) {
            console.log('No records to export.');
            menu();
            break;
          }

          const now = new Date();
          const header = `Export File: export.txt\nDate & Time: ${now.toLocaleString()}\nTotal Records: ${allRecords.length}\n===============================\n\n`;
          let content = header;

          allRecords.forEach((r, index) => {
            content += `${index + 1}. ID: ${r._id}\n`;
            content += `   Name: ${r.name}\n`;
            content += `   Value: ${r.value}\n`;
            content += `   Created: ${new Date(r.createdAt).toLocaleString()}\n`;
            content += `   Updated: ${r.updatedAt ? new Date(r.updatedAt).toLocaleString() : 'N/A'}\n`;
            content += `   -------------------------------\n`;
          });

          fs.writeFile('export.txt', content, (err) => {
            if (err) {
              console.log('❌ Error exporting data:', err);
            } else {
              console.log('✅ Data exported successfully to export.txt.');
            }
            menu();
          });
        } catch (error) {
          console.error('❌ Error exporting data:', error.message);
          menu();
        }
        break;

      case '9':   // Vault Statistics
        try {
          const stats = await db.getVaultStats();
          console.log('\n📊 Vault Statistics:');
          console.log('--------------------------');
          console.log(`Total Records: ${stats.totalRecords}`);
          console.log(`Last Modified: ${stats.lastModified}`);
          console.log(`Longest Name: ${stats.longestName} (${stats.longestNameLength} characters)`);
          console.log(`Earliest Record: ${stats.earliestRecord}`);
          console.log(`Latest Record: ${stats.latestRecord}`);
          console.log('--------------------------\n');
          menu();
        } catch (error) {
          console.error('❌ Error getting vault statistics:', error.message);
          menu();
        }
        break;

      default:
        console.log('❌ Invalid option.');
        menu();
    }
  });
}

// Start the application
initialize();
