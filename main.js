const readline = require('readline');
const db = require('./db');
require('./events/logger'); // Initialize event logger

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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
=====================
  `);

  rl.question('Choose option: ', ans => {
    switch (ans.trim()) {
      case '1':
        rl.question('Enter name: ', name => {
          rl.question('Enter value: ', value => {
            db.addRecord({ name, value });
            console.log('✅ Record added successfully!');
            menu();
          });
        });
        break;

      case '2':
        const records = db.listRecords();
        if (records.length === 0) console.log('No records found.');
        else records.forEach(r => console.log(`ID: ${r.id} | Name: ${r.name} | Value: ${r.value}`));
        menu();
        break;

      case '3':
        rl.question('Enter record ID to update: ', id => {
          rl.question('New name: ', name => {
            rl.question('New value: ', value => {
              const updated = db.updateRecord(Number(id), name, value);
              console.log(updated ? '✅ Record updated!' : '❌ Record not found.');
              menu();
            });
          });
        });
        break;

      case '4':
        rl.question('Enter record ID to delete: ', id => {
          const deleted = db.deleteRecord(Number(id));
          console.log(deleted ? '🗑️ Record deleted!' : '❌ Record not found.');
          menu();
        });
        break;

      case '5':
        console.log('👋 Exiting NodeVault...');
        rl.close();
        break;
      
      case '6':
        rl.question('Enter search keyword (name or ID): ', keyword => {

        const all = db.listRecords();

        const results = all.filter(r =>

            r.name.toLowerCase().includes(keyword.toLowerCase()) ||

            r.id.toString() === keyword

        );



        if (results.length === 0) {

            console.log('No matching records found.');

        } else {

            console.log(`Found ${results.length} result(s):`);

            results.forEach(r => {

                console.log(`ID: ${r.id} | Name: ${r.name} | Value: ${r.value}`);

            });

         }

        menu();

    });

        break;

      case '7':

    console.log("Sort By:");

    console.log("1. Name");

    console.log("2. Creation Date");



    rl.question("Choose field (1 or 2): ", field => {

        rl.question("Order (asc/desc): ", order => {



            const records = db.listRecords();



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

                console.log(`ID: ${r.id} | Name: ${r.name} | Created: ${r.createdAt}`);

            });



            menu();

        });

    });

    break;

      case '8':

    const fs = require('fs'); // at the top of main.js, if not already included

    const allRecords = db.listRecords();

    if (allRecords.length === 0) {

        console.log('No records to export.');

        menu();

        break;

    }



    const now = new Date();

    const header = `Export File: export.txt\nDate & Time: ${now.toLocaleString()}\nTotal Records: ${allRecords.length}\n-----------------------------\n`;

    let content = header;



    allRecords.forEach((r, index) => {

        content += `${index + 1}. ID: ${r.id} | Name: ${r.name} | Created: ${r.creationDate} | Value: ${r.value}\n`;

    });



    fs.writeFile('export.txt', content, (err) => {

        if (err) {

            console.log('Error exporting data:', err);

        } else {

            console.log('Data exported successfully to export.txt.');

        }

        menu();

    });

    break;



      default:
        console.log('Invalid option.');
        menu();
    }
  });
}

menu();


