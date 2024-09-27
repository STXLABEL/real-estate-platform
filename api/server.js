const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');

// Load environment variables
dotenv.config();

// Check if the Mongo URI is loaded correctly
console.log('Mongo URI:', process.env.MONGO_URI);

const app = express();

app.use(cors());
app.use(bodyParser.json());

// User Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/globalSettingsRoutes'));
app.use('/api/admin', require('./routes/templateRoutes'));
// Email Template Routes
app.use('/api/templates', require('./routes/emailTemplateRoutes'));



// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Start the server
const PORT = process.env.PORT || 7001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
