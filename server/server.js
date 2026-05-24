require('dotenv').config();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first'); // FIX for Node 18+ Windows network ipv6 fallback issues

// Polyfill DOMMatrix for pdf-parse compatibility in Node.js 22+
if (typeof DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix {};
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// Fallback for SPA or simple HTML serving if needed
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../client', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
