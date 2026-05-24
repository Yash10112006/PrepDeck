const Document = require('../models/Document');

const uploadDocument = async (req, res) => {
  try {
    const { subject, semester, type, year, examType } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const newDoc = await Document.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      subject,
      semester,
      type,
      year: type === 'PYQ' ? year : null,
      examType: type === 'PYQ' ? examType : null,
      uploader: req.user._id,
      filepath: `/uploads/${req.file.filename}`
    });

    res.status(201).json(newDoc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDocuments = async (req, res) => {
  try {
    const { type, subject, semester, year, examType } = req.query;
    
    let query = {};
    if (type) query.type = type;
    if (subject) query.subject = new RegExp(subject, 'i');
    if (semester) query.semester = semester;
    if (year) query.year = year;
    if (examType) query.examType = examType;

    const docs = await Document.find(query).sort({ uploadDate: -1 }).populate('uploader', 'name email');
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFilteredNotes = async (req, res) => {
  try {
    const { semester, subject } = req.query;
    let query = { type: 'Note' };
    
    if (semester) query.semester = semester;
    if (subject) query.subject = new RegExp(`^${subject}$`, 'i'); // exact or partial depending on UI. We will use flexible partial matching
    
    // Better flexible text matching
    if (subject) query.subject = { $regex: subject, $options: 'i' };

    const notes = await Document.find(query).sort({ uploadDate: -1 }).populate('uploader', 'name email');
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFilteredPyqs = async (req, res) => {
  try {
    const { year, subject, examType } = req.query;
    let query = { type: 'PYQ' };
    
    if (year) query.year = year;
    if (examType) query.examType = examType;
    if (subject) query.subject = { $regex: subject, $options: 'i' };

    const pyqs = await Document.find(query).sort({ uploadDate: -1 }).populate('uploader', 'name email');
    res.json(pyqs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDocumentById = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (doc) {
      res.json(doc);
    } else {
      res.status(404).json({ message: 'Document not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadDocument, getDocuments, getDocumentById, getFilteredNotes, getFilteredPyqs };
