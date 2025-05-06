import mongoose, { Document, Schema } from 'mongoose';

export interface IVideo extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  filename: string;
  fileKey: string; // S3 object key
  size: number;
  uploadStatus: 'pending' | 'processing' | 'completed' | 'failed';
  uploadId?: string; // S3 multipart upload ID
  uploadedParts?: { ETag: string; PartNumber: number }[];
  uploadedAt: Date;
}

const videoSchema = new Schema<IVideo>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  fileKey: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  uploadStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  uploadId: {
    type: String,
  },
  uploadedParts: [
    {
      ETag: String,
      PartNumber: Number,
    }
  ],
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IVideo>('Video', videoSchema);