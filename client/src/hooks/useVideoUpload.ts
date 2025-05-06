import { useState, useCallback } from 'react';
import videoService from '../services/api';
import type { UploadProgress } from '../types';
// import { UploadProgress } from '../types';

// Calculate optimal chunk size and number of parts
const calculateChunks = (fileSize: number) => {
  // Minimum chunk size 5MB (except for the last chunk)
  const MIN_CHUNK_SIZE = 5 * 1024 * 1024;
  // Maximum chunk size 100MB (for better UI feedback)
  const MAX_CHUNK_SIZE = 100 * 1024 * 1024;
  
  // Calculate optimal number of chunks
  let numParts = Math.ceil(fileSize / MAX_CHUNK_SIZE);
  numParts = Math.max(numParts, 1); // At least 1 part
  
  // Calculate chunk size
  const chunkSize = Math.max(Math.ceil(fileSize / numParts), MIN_CHUNK_SIZE);
  
  // Recalculate numParts based on adjusted chunk size
  numParts = Math.ceil(fileSize / chunkSize);
  
  return {
    chunkSize,
    numParts
  };
};

// Custom hook for video uploads
export const useVideoUpload = () => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [cancelUpload, setCancelUpload] = useState(false);

  // Upload a video file with title and description
  const uploadVideo = useCallback(async (
    title: string, 
    description: string, 
    file: File
  ) => {
    setIsUploading(true);
    setCancelUpload(false);
    
    try {
      // Calculate chunks
      const { chunkSize, numParts } = calculateChunks(file.size);
      
      // Initialize upload progress
      setUploadProgress({
        videoId: '',
        totalParts: numParts,
        uploadedParts: 0,
        percentage: 0,
        status: 'pending',
      });
      
      // Initialize multipart upload
      const initResponse = await videoService.initUpload(
        title,
        description,
        file.name,
        file.size,
        file.type,
        numParts
      );
      
      setUploadProgress(prev => ({
        ...prev!,
        videoId: initResponse.videoId,
        status: 'uploading',
      }));
      
      // Prepare parts for upload
      const parts = [];
      for (let partNumber = 1; partNumber <= numParts; partNumber++) {
        // Check if upload was cancelled
        if (cancelUpload) {
          await videoService.abortUpload(initResponse.videoId);
          setUploadProgress(prev => ({
            ...prev!,
            status: 'canceled',
          }));
          setIsUploading(false);
          return { success: false, status: 'canceled' };
        }
        
        // Calculate chunk start and end
        const start = (partNumber - 1) * chunkSize;
        const end = Math.min(partNumber * chunkSize, file.size);
        const chunk = file.slice(start, end);
        
        // Get presigned URL for this part
        const urlResponse = await videoService.getUploadUrl(
          initResponse.videoId,
          partNumber
        );
        
        // Upload chunk to S3 directly using presigned URL
        const etag = await videoService.uploadFilePart(
          urlResponse.presignedUrl,
          chunk
        );
        
        // Complete part in our backend
        await videoService.completePart(
          initResponse.videoId,
          partNumber,
          etag
        );
        
        // Update progress
        parts.push({ ETag: etag, PartNumber: partNumber });
        setUploadProgress(prev => ({
          ...prev!,
          uploadedParts: partNumber,
          percentage: Math.round((partNumber / numParts) * 100),
        }));
      }
      
      // Check if upload was cancelled
      if (cancelUpload) {
        await videoService.abortUpload(initResponse.videoId);
        setUploadProgress(prev => ({
          ...prev!,
          status: 'canceled',
        }));
        setIsUploading(false);
        return { success: false, status: 'canceled' };
      }
      
      // Complete the multipart upload
      await videoService.completeUpload(initResponse.videoId);
      
      // Update progress to completed
      setUploadProgress(prev => ({
        ...prev!,
        percentage: 100,
        status: 'completed',
      }));
      
      setIsUploading(false);
      return { success: true, videoId: initResponse.videoId };
    } catch (error: any) {
      console.error('Upload error:', error);
      
      // Update progress to failed
      setUploadProgress(prev => ({
        ...prev!,
        status: 'failed',
        error: error.message || 'Upload failed',
      }));
      
      setIsUploading(false);
      return { success: false, error: error.message || 'Upload failed' };
    }
  }, [cancelUpload]);

  // Cancel the current upload
  const cancelCurrentUpload = useCallback(() => {
    if (isUploading) {
      setCancelUpload(true);
    }
  }, [isUploading]);

  return {
    uploadVideo,
    cancelUpload: cancelCurrentUpload,
    uploadProgress,
    isUploading,
  };
};