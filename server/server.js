require('dotenv').config();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

// Polyfill DOMMatrix for pdf-parse compatibility in Node.js 22+
if (typeof DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix {};
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // ADD THIS

const app = express();
const PORT = process.env.PORT || 5000;

// CREATE UPLOADS FOLDER AUTOMATICALLY
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(uploadsDir));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../client')));

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/docs', require('./routes/docRoutes'));
app.use('/api/study', require('./routes/studyRoutes'));

// Specific Filter Routes (Notes & PYQs)
const { protect } = require('./middleware/authMiddleware');
const { getFilteredNotes, getFilteredPyqs } = require('./controllers/docController');

app.get('/api/notes', protect, getFilteredNotes);
app.get('/api/pyqs', protect, getFilteredPyqs);

// Fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/uploads')) {
    return res.status(404).send('File not found');
  }

  res.sendFile(path.join(__dirname, '../client', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});