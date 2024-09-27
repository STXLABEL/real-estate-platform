const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Test if MONGO_URI is loaded
console.log('MONGO_URI:', process.env.MONGO_URI);
