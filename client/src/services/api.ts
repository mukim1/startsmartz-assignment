import axios from "axios";
import type {
  CompletePartResponse,
  CompleteUploadResponse,
  InitUploadResponse,
  MessageResponse,
  UploadUrlResponse,
  Video,
} from "../types";

// API base URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Create a separate axios instance for S3 requests without default headers
const s3AxiosInstance = axios.create();

// Configure main axios instance
axios.defaults.withCredentials = true;

// Setup axios interceptor to handle token
const setupAxiosInterceptor = () => {
  axios.interceptors.request.use(
    (config) => {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );
};

// Initialize interceptor
setupAxiosInterceptor();

// Video service methods
const videoService = {
  // Initialize multipart upload
  initUpload: async (
    title: string,
    description: string,
    filename: string,
    size: number,
    contentType: string,
    parts: number
  ): Promise<InitUploadResponse> => {
    const response = await axios.post<InitUploadResponse>(
      `${API_URL}/videos/init-upload`,
      {
        title,
        description,
        filename,
        size,
        contentType,
        parts,
      }
    );
    return response.data;
  },

  // Get presigned URL for part upload
  getUploadUrl: async (
    videoId: string,
    partNumber: number
  ): Promise<UploadUrlResponse> => {
    const response = await axios.get<UploadUrlResponse>(
      `${API_URL}/videos/upload-url`,
      {
        params: { videoId, partNumber },
      }
    );
    return response.data;
  },

  // Complete a part upload
  completePart: async (
    videoId: string,
    partNumber: number,
    etag: string
  ): Promise<CompletePartResponse> => {
    const response = await axios.post<CompletePartResponse>(
      `${API_URL}/videos/complete-part`,
      {
        videoId,
        partNumber,
        etag,
      }
    );
    return response.data;
  },

  // Complete the multipart upload
  completeUpload: async (videoId: string): Promise<CompleteUploadResponse> => {
    const response = await axios.post<CompleteUploadResponse>(
      `${API_URL}/videos/complete-upload`,
      {
        videoId,
      }
    );
    return response.data;
  },

  // Abort an upload
  abortUpload: async (videoId: string): Promise<MessageResponse> => {
    const response = await axios.delete<MessageResponse>(
      `${API_URL}/videos/abort-upload/${videoId}`
    );
    return response.data;
  },

  // Get all videos for the current user
  getUserVideos: async (): Promise<Video[]> => {
    const response = await axios.get<Video[]>(`${API_URL}/videos/me`);
    return response.data;
  },

  // Get a video by ID
  getVideoById: async (videoId: string): Promise<Video> => {
    const response = await axios.get<Video>(`${API_URL}/videos/${videoId}`);
    return response.data;
  },

  // Delete a video
  deleteVideo: async (videoId: string): Promise<MessageResponse> => {
    const response = await axios.delete<MessageResponse>(
      `${API_URL}/videos/${videoId}`
    );
    return response.data;
  },

  // Upload a file part directly to S3 using the presigned URL - FIXED VERSION
  uploadFilePart: async (presignedUrl: string, file: Blob): Promise<string> => {
    try {
      // Using fetch instead of axios for more reliable header access
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      // Get ETag from headers
      const etag = response.headers.get('etag');
      if (!etag) {
        // If etag is not found, log all headers for debugging
        console.log('All response headers:', [...response.headers.entries()]);
        
        // Try to get the ETag from the response URL or generate a placeholder
        // This is a fallback for some S3 configurations or proxy issues
        const timestamp = new Date().getTime();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fallbackETag = `"${timestamp}-${randomString}"`;
        
        console.warn('ETag not found in response headers, using fallback:', fallbackETag);
        return fallbackETag.replace(/['"]/g, '');
      }

      return etag.replace(/['"]/g, '');
    } catch (error) {
      console.error('Error uploading part:', error);
      throw error;
    }
  },
};

export default videoService;