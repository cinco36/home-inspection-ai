import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs-extra';
import upload from '../middleware/upload';
import fileService from '../services/fileService';
import fileValidationService from '../services/fileValidationService';
import fileProcessingQueue from '../config/queue';

const router = Router();

// POST /api/v1/upload - Upload a file
router.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const file = req.file;
    const filePath = file.path;

    // Validate the uploaded file
    const validation = await fileValidationService.validateFile(filePath);
    
    if (!validation.isValid) {
      // Remove the invalid file
      await fs.remove(filePath);
      
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    // Create file record in database
    const fileData = {
      filename: file.originalname,
      original_filename: file.originalname,
      stored_filename: file.filename,
      mime_type: validation.detectedType || file.mimetype,
      file_path: filePath,
      size: file.size
    };

    const savedFile = await fileService.createFile(fileData);

    // Add file processing job to queue
    try {
      await fileProcessingQueue.add({
        fileId: savedFile.id,
        filePath: savedFile.file_path,
        originalFilename: savedFile.original_filename
      });
      
      console.log(`Added file processing job for: ${savedFile.id}`);
    } catch (queueError) {
      console.error('Error adding job to queue:', queueError);
      // Don't fail the upload if queue fails
    }

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        id: savedFile.id,
        original_filename: savedFile.original_filename,
        stored_filename: savedFile.stored_filename,
        mime_type: savedFile.mime_type,
        size: savedFile.size,
        processing_status: savedFile.processing_status,
        created_at: savedFile.created_at
      }
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    
    // Clean up uploaded file if there was an error
    if (req.file) {
      await fs.remove(req.file.path).catch(console.error);
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to upload file'
    });
  }
});

// GET /api/v1/upload/:id/download - Download a file
router.get('/:id/download', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get file record from database
    const file = await fileService.getFileById(id);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Check if file exists on disk
    if (!await fs.pathExists(file.file_path)) {
      return res.status(404).json({
        success: false,
        error: 'File not found on disk'
      });
    }

    // Set headers for file download
    res.setHeader('Content-Type', file.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${file.original_filename}"`);
    res.setHeader('Content-Length', file.size.toString());

    // Stream the file
    const fileStream = fs.createReadStream(file.file_path);
    fileStream.pipe(res);

  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download file'
    });
  }
});

// Error handling for multer
router.use((error: any, req: Request, res: Response, next: any) => {
  if (error instanceof Error) {
          if (error.message.includes('File too large')) {
        return res.status(400).json({
          success: false,
          error: 'File size exceeds the maximum limit of 50MB'
        });
      }
    
    if (error.message.includes('Invalid file type') || error.message.includes('Invalid MIME type')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
  
  console.error('Upload error:', error);
  res.status(500).json({
    success: false,
    error: 'Upload failed'
  });
});

export default router; 