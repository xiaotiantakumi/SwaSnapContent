import { useCallback, useState } from 'react';

import { MAX_FILE_SIZE, SUPPORTED_FILE_EXTENSIONS } from '../lib/markdown-constants';

interface DragAndDropHookReturn {
  isDragOver: boolean;
  handleDragOver: (event: React.DragEvent) => void;
  handleDragLeave: (event: React.DragEvent) => void;
  handleDrop: (event: React.DragEvent) => Promise<void>;
}

interface UseDragAndDropOptions {
  onFileContent?: (content: string) => void;
  onFiles?: (files: File[]) => void;
  onError: (error: string) => void;
}

/**
 * Custom hook for drag and drop file handling
 * Validates file types and provides visual feedback during drag operations
 */
export function useDragAndDrop({
  onFileContent,
  onFiles,
  onError,
}: UseDragAndDropOptions): DragAndDropHookReturn {
  const [isDragOver, setIsDragOver] = useState(false);

  const validateFile = (file: File): string | null => {
    // Skip directories and empty files
    if (file.size === 0 && file.type === '') {
      return 'Directories cannot be processed. Please select individual files.';
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!SUPPORTED_FILE_EXTENSIONS.includes(extension as '.md' | '.markdown' | '.txt')) {
      return `Unsupported file type "${extension}". Please use: ${SUPPORTED_FILE_EXTENSIONS.join(', ')}`;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`;
    }

    return null;
  };

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // Check if dragged items contain files
    const hasFiles = Array.from(event.dataTransfer.types).includes('Files');
    if (hasFiles) {
      setIsDragOver(true);
      event.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();

    // Only set isDragOver to false if we're leaving the main container
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;

    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragOver(false);

      const files = Array.from(event.dataTransfer.files);


      if (files.length === 0) {
        onError(
          'No files were dropped. Please drop individual files, not directories.',
        );
        return;
      }

      // Filter and validate files
      const validFiles: File[] = [];
      const errors: string[] = [];

      for (const file of files) {
        const validationError = validateFile(file);
        if (validationError) {
          errors.push(`${file.name}: ${validationError}`);
        } else {
          validFiles.push(file);
        }
      }

      // Show errors if any
      if (errors.length > 0) {
        onError(errors.join('\n'));
        return;
      }

      // Check if we have any valid files after filtering
      if (validFiles.length === 0) {
        onError(
          'No valid markdown files found. Please drop .md, .markdown, or .txt files.',
        );
        return;
      }

      try {
        if (onFiles) {
          // Handle multiple files
          onFiles(validFiles);
        } else if (onFileContent && validFiles.length > 0) {
          // Legacy single file handling
          if (validFiles.length > 1) {
            onError('Please drop only one file at a time for single file mode');
            return;
          }
          const content = await validFiles[0].text();
          onFileContent(content);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to read files';
        onError(`Error reading files: ${errorMessage}`);
      }
    },
    [onFileContent, onFiles, onError],
  );

  return {
    isDragOver,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}