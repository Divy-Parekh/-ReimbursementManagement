const multer = require('multer');
const path = require('path');
const { sendError } = require('../utils/responseHelper');

// Consts
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 5242880; // 5MB

// Storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter (Images and PDFs)
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and PDF files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter: fileFilter,
});

// Wrapper to standardise error handling
const handleUpload = (req, res, next) => {
  const uploader = upload.single('receipt');

  uploader(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading.
      if (err.code === 'LIMIT_FILE_SIZE') {
        return sendError(res, 400, 'File too large. Maximum size is 5MB.');
      }
      return sendError(res, 400, err.message);
    } else if (err) {
      // An unknown error occurred when uploading.
      return sendError(res, 400, err.message);
    }
    // Everything went fine.
    next();
  });
};

module.exports = {
  upload: handleUpload,
};
