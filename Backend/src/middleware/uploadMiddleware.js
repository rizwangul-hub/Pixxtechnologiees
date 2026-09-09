const multer = require('multer');
const path = require('path');

// Configure multer memory storage
const storage = multer.memoryStorage();

// Block dangerous executable extensions
const DISALLOWED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.bin', '.msi', '.jar', '.js', '.vbs', '.scr', '.pif', '.com'
];

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB limit
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Explicit security check against dangerous executables
    if (DISALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error(`Security Alert: Executable file type (${ext}) is strictly disallowed.`));
    }

    // Allow image formats, PDFs, Word, Excel, CSV, TXT, and common document mimetypes
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.mimetype === 'text/plain' ||
      file.mimetype === 'text/csv' ||
      ['.pdf', '.png', '.jpg', '.jpeg', '.webp', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'].includes(ext)
    ) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported document format. Allowed formats: PDF, PNG, JPG, WEBP, DOC, DOCX, XLS, XLSX, TXT, CSV'));
    }
  },
});

module.exports = upload;
