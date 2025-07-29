import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Generate UUID filename with original extension
    const fileExtension = path.extname(file.originalname);
    const uuidFilename = `${uuidv4()}${fileExtension}`;
    cb(null, uuidFilename);
  }
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file extension first (quick check)
  const allowedExtensions = ['.pdf', '.doc', '.docx'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(fileExtension)) {
    return cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
  }
  
  // Check MIME type
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Invalid MIME type. Only PDF, DOC, and DOCX files are allowed.'));
  }
  
  cb(null, true);
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 1 // Only allow 1 file per request
  }
});

export default upload; 