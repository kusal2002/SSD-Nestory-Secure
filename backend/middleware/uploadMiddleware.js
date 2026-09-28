const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const ErrorResponse = require('../utils/errorResponse');

// Ensure upload directory exists securely
const uploadDir = path.join(__dirname, '../uploads/pdf');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set storage engine with sanitized, randomized filenames
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate secure randomized filename and strictly enforce .pdf extension
    const randomSuffix = crypto.randomBytes(8).toString('hex');
    cb(null, `story-${Date.now()}-${randomSuffix}.pdf`);
  }
});

// Check file type (initial check for extension and declared MIME)
function checkFileType(file, cb) {
  const allowedExtensions = ['.pdf'];
  const allowedMimeTypes = ['application/pdf', 'application/x-pdf'];

  const ext = path.extname(file.originalname).toLowerCase();
  const isExtAllowed = allowedExtensions.includes(ext);
  const isMimeAllowed = allowedMimeTypes.includes(file.mimetype);

  if (isExtAllowed && isMimeAllowed) {
    return cb(null, true);
  } else {
    cb(new ErrorResponse('Error: Only PDF documents are allowed!', 400));
  }
}

// Multer upload instance
const multerUpload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
});

/**
 * Secure upload wrapper:
 * Inspects file binary signature (magic bytes) after upload.
 * If the file does not begin with '%PDF-' (0x25 0x50 0x44 0x46),
 * the file is immediately deleted from disk and rejected with HTTP 400.
 */
const upload = {
  ...multerUpload,
  single: function (fieldName) {
    const multerSingle = multerUpload.single(fieldName);

    return function (req, res, next) {
      multerSingle(req, res, function (err) {
        if (err) {
          const statusCode = err.statusCode || (err instanceof multer.MulterError ? 400 : 400);
          return res.status(statusCode).json({
            success: false,
            message: err.message || 'File upload error'
          });
        }

        // If no file was uploaded, continue to next middleware
        if (!req.file) {
          return next();
        }

        const filePath = req.file.path;

        try {
          // Verify Magic Bytes (%PDF-)
          const fd = fs.openSync(filePath, 'r');
          const buffer = Buffer.alloc(5);
          const bytesRead = fs.readSync(fd, buffer, 0, 5, 0);
          fs.closeSync(fd);

          const magicBytes = buffer.slice(0, 5).toString('ascii');

          if (bytesRead < 5 || magicBytes !== '%PDF-') {
            // Delete the spoofed file from disk immediately
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
            return res.status(400).json({
              success: false,
              message: 'Error: Invalid file signature. Only genuine PDF documents are allowed!'
            });
          }

          next();
        } catch (readErr) {
          // Cleanup on file read error
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          return res.status(400).json({
            success: false,
            message: 'Error verifying file contents.'
          });
        }
      });
    };
  }
};

module.exports = upload;

