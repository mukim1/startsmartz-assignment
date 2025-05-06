// Auth types
export interface User {
  _id: string;
  email: string;
  token?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Video types
export interface Video {
  _id: string;
  title: string;
  description: string;
  filename: string;
  size: number;
  uploadedAt: string;
  downloadUrl?: string;
}

export interface UploadProgress {
  videoId: string;
  totalParts: number;
  uploadedParts: number;
  percentage: number;
  status: "pending" | "uploading" | "completed" | "failed" | "canceled";
  error?: string;
  speedBytesPerSecond?: number;
  uploadedBytes?: number;
  totalBytes?: number;
  estimatedTimeRemaining?: number | null; // in seconds
}

// API Response types
export interface AuthResponse {
  _id: string;
  email: string;
  token: string;
}

export interface InitUploadResponse {
  videoId: string;
  uploadId: string;
  key: string;
  parts: number;
}

export interface UploadUrlResponse {
  presignedUrl: string;
  partNumber: number;
}

export interface CompletePartResponse {
  message: string;
  part: {
    ETag: string;
    PartNumber: number;
  };
}

export interface CompleteUploadResponse {
  message: string;
  video: Video;
}

export interface MessageResponse {
  message: string;
}

// Form types
export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface VideoFormData {
  title: string;
  description: string;
  file: File;
}

// Custom events
export interface UploadProgressEvent {
  loaded: number;
  total: number;
}
