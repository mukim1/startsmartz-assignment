import { 
    S3Client, 
    CreateMultipartUploadCommand,
    UploadPartCommand,
    CompleteMultipartUploadCommand,
    AbortMultipartUploadCommand,
    DeleteObjectCommand
  } from '@aws-sdk/client-s3';
  import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
  import { v4 as uuidv4 } from 'uuid';
  
  // Initialize S3 client
  const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  });
  
  const bucketName = process.env.S3_BUCKET_NAME || 'abulovoski';
  
  // S3 service for multipart uploads
  export default {
    // Initialize a multipart upload and return the uploadId
    async createMultipartUpload(filename: string, contentType: string): Promise<{ uploadId: string, key: string }> {
      const key = `uploads/${uuidv4()}-${filename}`;
      
      const command = new CreateMultipartUploadCommand({
        Bucket: bucketName,
        Key: key,
        ContentType: contentType,
      });
      
      const { UploadId } = await s3Client.send(command);
      
      if (!UploadId) {
        throw new Error('Failed to create multipart upload');
      }
      
      return { uploadId: UploadId, key };
    },
    
    // Generate a presigned URL for uploading a part
    async getUploadPartPresignedUrl(key: string, uploadId: string, partNumber: number): Promise<string> {
      const command = new UploadPartCommand({
        Bucket: bucketName,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
      });
      
      // URL expires in 1 hour
      return getSignedUrl(s3Client, command, { expiresIn: 3600 });
    },
    
    // Complete a multipart upload
    async completeMultipartUpload(key: string, uploadId: string, parts: { ETag: string; PartNumber: number }[]): Promise<string> {
      const command = new CompleteMultipartUploadCommand({
        Bucket: bucketName,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: {
          Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber),
        },
      });
      
      const result = await s3Client.send(command);
      return result.Location || key;
    },
    
    // Abort a multipart upload
    async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
      const command = new AbortMultipartUploadCommand({
        Bucket: bucketName,
        Key: key,
        UploadId: uploadId,
      });
      
      await s3Client.send(command);
    },
    
    // Delete an object from S3
    async deleteObject(key: string): Promise<void> {
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      
      await s3Client.send(command);
    },
    
    // Get a presigned URL for downloading/viewing a video
    async getPresignedDownloadUrl(key: string): Promise<string> {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      
      // URL expires in 1 hour
      return getSignedUrl(s3Client, command, { expiresIn: 3600 });
    }
  };
  
  // Missing import
  import { GetObjectCommand } from '@aws-sdk/client-s3';