const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const { protect } = require('../middleware/authMiddleware');

/**
 * @desc    Upload image/document to Cloudinary
 * @route   POST /api/upload
 * @access  Private
 */
router.post('/', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const rawFolder = req.body.folder || 'pixx_technologies';
    const folder = rawFolder.replace(/[^a-zA-Z0-9_\-\/]/g, '').replace(/\.\./g, '');
    const result = await uploadToCloudinary(req.file.buffer, folder);

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully to Cloudinary',
      url: result.url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error('[Upload Error]', error.message);
    res.status(500).json({ success: false, message: error.message || 'File upload failed' });
  }
});

module.exports = router;
