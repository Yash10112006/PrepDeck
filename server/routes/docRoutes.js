const express = require('express');
const router = express.Router();
const { uploadDocument, getDocuments, getDocumentById } = require('../controllers/docController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/upload', protect, upload.single('file'), uploadDocument);
router.get('/', protect, getDocuments);
router.get('/:id', protect, getDocumentById);

module.exports = router;
