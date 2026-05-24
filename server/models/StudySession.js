const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  durationMs: { type: Number, default: 0 },
  focusedMs: { type: Number, default: 0 },
  distractedMs: { type: Number, default: 0 }
});

module.exports = mongoose.model('StudySession', studySessionSchema);
