// test-env.js - Test environment variables
require('dotenv').config();

console.log('=== Testing Environment Variables ===\n');

console.log('MONGO_URI:', process.env.MONGO_URI || 'Not set (using default)');
console.log('MONGO_DB_NAME:', process.env.MONGO_DB_NAME || 'Not set (using default: nodevault)');
console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set (using default: development)');

console.log('\n=== End of Test ===');
