import { fileTypeFromBuffer } from 'file-type';
import fs from 'fs-extra';
import path from 'path';

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  detectedType?: string;
}

export class FileValidationService {
  private allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  private allowedExtensions = ['.pdf', '.doc', '.docx'];

  async validateFile(filePath: string): Promise<FileValidationResult> {
    try {
      // Check if file exists
      if (!await fs.pathExists(filePath)) {
        return {
          isValid: false,
          error: 'File does not exist'
        };
      }

      // Check file size
      const stats = await fs.stat(filePath);
      const maxSize = 50 * 1024 * 1024; // 50MB
      
      if (stats.size > maxSize) {
        return {
          isValid: false,
          error: `File size (${stats.size} bytes) exceeds maximum allowed size (${maxSize} bytes)`
        };
      }

      // Check file extension
      const fileExtension = path.extname(filePath).toLowerCase();
      if (!this.allowedExtensions.includes(fileExtension)) {
        return {
          isValid: false,
          error: `File extension '${fileExtension}' is not allowed. Allowed extensions: ${this.allowedExtensions.join(', ')}`
        };
      }

      // Read file buffer for type detection
      const buffer = await fs.readFile(filePath);
      
      // Use file-type library to detect actual file type
      const fileType = await fileTypeFromBuffer(buffer);
      
      if (!fileType) {
        return {
          isValid: false,
          error: 'Could not determine file type'
        };
      }

      // Check if detected MIME type is allowed
      if (!this.allowedMimeTypes.includes(fileType.mime)) {
        return {
          isValid: false,
          error: `File type '${fileType.mime}' is not allowed. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
          detectedType: fileType.mime
        };
      }

      return {
        isValid: true,
        detectedType: fileType.mime
      };

    } catch (error) {
      return {
        isValid: false,
        error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  validateFileExtension(filename: string): boolean {
    const extension = path.extname(filename).toLowerCase();
    return this.allowedExtensions.includes(extension);
  }

  validateMimeType(mimeType: string): boolean {
    return this.allowedMimeTypes.includes(mimeType);
  }
}

export default new FileValidationService(); 