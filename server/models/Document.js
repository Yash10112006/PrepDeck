const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  subject: { type: String, required: true },
  semester: { type: String, required: true },
  type: { type: String, enum: ['Note', 'PYQ'], required: true },
  year: { type: String }, // Optional, mostly for PYQ
  examType: { type: String, enum: ['midsem', 'endsem', 'backlog'] }, // For PYQs
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadDate: { type: Date, default: Date.now },
  filepath: { type: String, required: true }
});

module.exports = mongoose.model('Document', documentSchema);
