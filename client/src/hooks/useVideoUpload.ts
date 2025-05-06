import { useState, useCallback, useRef } from 'react';
import videoService from '../services/api';
import type { UploadProgress } from '../types';

// Calculate optimal chunk size and number of parts
const calculateChunks = (fileSize: number) => {
  // Minimum chunk size 5MB (except for the last chunk)
  const MIN_CHUNK_SIZE = 5 * 1024 * 1024;
  // Maximum chunk size 50MB (for better UI feedback)
  const MAX_CHUNK_SIZE = 50 * 1024 * 1024;
  
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
  const cancelUploadRef = useRef(false);

  // Upload a video file with title and description
  const uploadVideo = useCallback(async (
    title: string, 
    description: string, 
    file: File
  ) => {
    setIsUploading(true);
    cancelUploadRef.current = false;
    
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
      const uploadedParts = [];
      let uploadedPartCount = 0;
      
      for (let partNumber = 1; partNumber <= numParts; partNumber++) {
        // Check if upload was cancelled
        if (cancelUploadRef.current) {
          console.log("Upload cancelled by user");
          await videoService.abortUpload(initResponse.videoId);
          setUploadProgress(prev => ({
            ...prev!,
            status: 'canceled',
          }));
          setIsUploading(false);
          return { success: false, status: 'canceled' };
        }
        
        try {
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
          
          // Log successful part upload
          console.log(`Successfully uploaded part ${partNumber} with ETag: ${etag}`);
          
          // Complete part in our backend
          await videoService.completePart(
            initResponse.videoId,
            partNumber,
            etag
          );
          
          // Add to uploaded parts
          uploadedParts.push({ ETag: etag, PartNumber: partNumber });
          uploadedPartCount++;
          
          // Update progress
          setUploadProgress(prev => ({
            ...prev!,
            uploadedParts: uploadedPartCount,
            percentage: Math.round((uploadedPartCount / numParts) * 100),
          }));
        } catch (error) {
          console.error(`Error uploading part ${partNumber}:`, error);
          
          // Retry logic (you could add more sophisticated retry logic here)
          const MAX_RETRIES = 3;
          let retryCount = 0;
          let retrySuccess = false;
          
          while (retryCount < MAX_RETRIES && !retrySuccess && !cancelUploadRef.current) {
            retryCount++;
            console.log(`Retrying part ${partNumber} (attempt ${retryCount}/${MAX_RETRIES})...`);
            
            try {
              const start = (partNumber - 1) * chunkSize;
              const end = Math.min(partNumber * chunkSize, file.size);
              const chunk = file.slice(start, end);
              
              const urlResponse = await videoService.getUploadUrl(
                initResponse.videoId,
                partNumber
              );
              
              const etag = await videoService.uploadFilePart(
                urlResponse.presignedUrl,
                chunk
              );
              
              await videoService.completePart(
                initResponse.videoId,
                partNumber,
                etag
              );
              
              uploadedParts.push({ ETag: etag, PartNumber: partNumber });
              uploadedPartCount++;
              
              setUploadProgress(prev => ({
                ...prev!,
                uploadedParts: uploadedPartCount,
                percentage: Math.round((uploadedPartCount / numParts) * 100),
              }));
              
              retrySuccess = true;
            } catch (retryError) {
              console.error(`Retry ${retryCount} for part ${partNumber} failed:`, retryError);
              
              // Wait before retrying (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)));
            }
          }
          
          // If all retries failed, abort the upload
          if (!retrySuccess) {
            await videoService.abortUpload(initResponse.videoId);
            setUploadProgress(prev => ({
              ...prev!,
              status: 'failed',
              error: `Failed to upload part ${partNumber} after multiple retries`,
            }));
            setIsUploading(false);
            return { success: false, error: `Failed to upload part ${partNumber}` };
          }
        }
      }
      
      // Check if upload was cancelled
      if (cancelUploadRef.current) {
        await videoService.abortUpload(initResponse.videoId);
        setUploadProgress(prev => ({
          ...prev!,
          status: 'canceled',
        }));
        setIsUploading(false);
        return { success: false, status: 'canceled' };
      }
      
      // Complete the multipart upload
      console.log("All parts uploaded, completing multipart upload");
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
  }, []);

  // Cancel the current upload
  const cancelUpload = useCallback(() => {
    if (isUploading) {
      console.log("Setting cancelUpload flag to true");
      cancelUploadRef.current = true;
    }
  }, [isUploading]);

  return {
    uploadVideo,
    cancelUpload,
    uploadProgress,
    isUploading,
  };
};