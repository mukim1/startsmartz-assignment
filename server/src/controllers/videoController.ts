import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Video from '../models/Video';
import s3Service from '../services/s3Service';
import { 
  CompletePartInput, 
  CompleteUploadInput, 
  GetUploadUrlInput, 
  InitUploadInput
} from '../validation/schemas';

// @desc    Initialize multipart upload
// @route   POST /api/videos/init-upload
// @access  Private
export const initializeUpload = asyncHandler(async (req: Request, res: Response) => {
  const { title, description, filename, size, contentType, parts }: InitUploadInput = req.body;
  const userId = req.user._id;

  // Initialize multipart upload in S3
  const { uploadId, key } = await s3Service.createMultipartUpload(filename, contentType);

  // Create video document with pending status
  const video = await Video.create({
    userId,
    title,
    description,
    filename,
    fileKey: key,
    size,
    uploadStatus: 'pending',
    uploadId,
    uploadedParts: [],
  });

  res.status(201).json({
    videoId: video._id,
    uploadId,
    key,
    parts,
  });
});

// @desc    Get presigned URL for uploading a part
// @route   GET /api/videos/upload-url
// @access  Private
export const getUploadUrl = asyncHandler(async (req: Request, res: Response) => {
  const { videoId, partNumber }: GetUploadUrlInput = req.query as any;
  const userId = req.user._id;

  // Find the video
  const video = await Video.findOne({ 
    _id: videoId, 
    userId 
  });

  if (!video) {
    res.status(404).json({ message: 'Video not found' });
    return;
  }

  if (video.uploadStatus !== 'pending') {
    res.status(400).json({ message: 'Upload already completed or failed' });
    return;
  }

  // Generate presigned URL for the part
  const presignedUrl = await s3Service.getUploadPartPresignedUrl(
    video.fileKey,
    video.uploadId!,
    partNumber
  );

  res.json({
    presignedUrl,
    partNumber,
  });
});

// @desc    Complete a part upload
// @route   POST /api/videos/complete-part
// @access  Private
export const completePart = asyncHandler(async (req: Request, res: Response) => {
  const { videoId, partNumber, etag }: CompletePartInput = req.body;
  const userId = req.user._id;

  // Find the video
  const video = await Video.findOne({ 
    _id: videoId, 
    userId 
  });

  if (!video) {
    res.status(404).json({ message: 'Video not found' });
    return;
  }

  if (video.uploadStatus !== 'pending') {
    res.status(400).json({ message: 'Upload already completed or failed' });
    return;
  }

  // Add part to completed parts
  const part = { ETag: etag, PartNumber: partNumber };
  
  if (!video.uploadedParts) {
    video.uploadedParts = [];
  }
  
  // Remove if part already exists
  video.uploadedParts = video.uploadedParts.filter(p => p.PartNumber !== partNumber);
  
  // Add new part
  video.uploadedParts.push(part);
  await video.save();

  res.json({
    message: 'Part completed',
    part,
  });
});

// @desc    Complete multipart upload
// @route   POST /api/videos/complete-upload
// @access  Private
export const completeUpload = asyncHandler(async (req: Request, res: Response) => {
  const { videoId }: CompleteUploadInput = req.body;
  const userId = req.user._id;

  // Find the video
  const video = await Video.findOne({ 
    _id: videoId, 
    userId 
  });

  if (!video) {
    res.status(404).json({ message: 'Video not found' });
    return;
  }

  if (video.uploadStatus !== 'pending') {
    res.status(400).json({ message: 'Upload already completed or failed' });
    return;
  }

  if (!video.uploadedParts || video.uploadedParts.length === 0) {
    res.status(400).json({ message: 'No parts uploaded' });
    return;
  }

  try {
    // Update status to processing
    video.uploadStatus = 'processing';
    await video.save();

    // Complete multipart upload in S3
    await s3Service.completeMultipartUpload(
      video.fileKey,
      video.uploadId!,
      video.uploadedParts
    );

    // Update video status to completed
    video.uploadStatus = 'completed';
    await video.save();

    res.json({
      message: 'Upload completed successfully',
      video: {
        _id: video._id,
        title: video.title,
        description: video.description,
        filename: video.filename,
        size: video.size,
        uploadStatus: video.uploadStatus,
        uploadedAt: video.uploadedAt,
      },
    });
  } catch (error) {
    // Update status to failed
    video.uploadStatus = 'failed';
    await video.save();

    // Abort multipart upload in S3
    await s3Service.abortMultipartUpload(video.fileKey, video.uploadId!);

    res.status(500).json({ message: 'Failed to complete upload' });
  }
});

// @desc    Abort multipart upload
// @route   DELETE /api/videos/abort-upload/:id
// @access  Private
export const abortUpload = asyncHandler(async (req: Request, res: Response) => {
  const videoId = req.params.id;
  const userId = req.user._id;

  // Find the video
  const video = await Video.findOne({ 
    _id: videoId, 
    userId 
  });

  if (!video) {
    res.status(404).json({ message: 'Video not found' });
    return;
  }

  if (video.uploadStatus !== 'pending') {
    res.status(400).json({ message: 'Cannot abort - upload already completed or failed' });
    return;
  }

  try {
    // Abort multipart upload in S3
    await s3Service.abortMultipartUpload(video.fileKey, video.uploadId!);

    // Delete video document
    await Video.deleteOne({ _id: videoId });

    res.json({ message: 'Upload aborted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to abort upload' });
  }
});

// @desc    Get all videos for the current user
// @route   GET /api/videos/me
// @access  Private
export const getUserVideos = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user._id;

  // Find all videos for the user
  const videos = await Video.find({ 
    userId,
    uploadStatus: 'completed' 
  }).sort({ uploadedAt: -1 });

  // Add download URLs
  const videosWithUrls = await Promise.all(
    videos.map(async (video) => {
      const downloadUrl = await s3Service.getPresignedDownloadUrl(video.fileKey);
      return {
        _id: video._id,
        title: video.title,
        description: video.description,
        filename: video.filename,
        size: video.size,
        uploadedAt: video.uploadedAt,
        downloadUrl,
      };
    })
  );

  res.json(videosWithUrls);
});

// @desc    Delete a video
// @route   DELETE /api/videos/:id
// @access  Private
export const deleteVideo = asyncHandler(async (req: Request, res: Response) => {
  const videoId = req.params.id;
  const userId = req.user._id;

  // Find the video
  const video = await Video.findOne({ 
    _id: videoId, 
    userId 
  });

  if (!video) {
    res.status(404).json({ message: 'Video not found' });
    return;
  }

  try {
    // Delete file from S3
    await s3Service.deleteObject(video.fileKey);

    // Delete video document
    await Video.deleteOne({ _id: videoId });

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete video' });
  }
});

// @desc    Get a video by ID
// @route   GET /api/videos/:id
// @access  Private
export const getVideoById = asyncHandler(async (req: Request, res: Response) => {
  const videoId = req.params.id;
  const userId = req.user._id;

  // Find the video
  const video = await Video.findOne({ 
    _id: videoId, 
    userId 
  });

  if (!video) {
    res.status(404).json({ message: 'Video not found' });
    return;
  }

  // Get download URL
  const downloadUrl = await s3Service.getPresignedDownloadUrl(video.fileKey);

  res.json({
    _id: video._id,
    title: video.title,
    description: video.description,
    filename: video.filename,
    size: video.size,
    uploadedAt: video.uploadedAt,
    downloadUrl,
  });
});