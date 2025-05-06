import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropzone } from "react-dropzone";
// import { videoUploadSchema } from '../validation/schemas';
import { useVideoUpload } from "../hooks/useVideoUpload";
// import { VideoUploadFormData } from '../validation/schemas';
import "../styles/UploadVideo.css";
import {
  videoUploadSchema,
  type VideoUploadFormData,
} from "../validation/schema";

const UploadVideoPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm<VideoUploadFormData>({
    resolver: zodResolver(videoUploadSchema),
  });

  const { uploadVideo, cancelUpload, uploadProgress, isUploading } =
    useVideoUpload();

  // Handle file drop
  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setSelectedFile(file);
      setValue("file", file);
    }
  };

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "video/*": [],
    },
    maxSize: 1024 * 1024 * 1024, // 1GB
    multiple: false,
    disabled: isUploading,
  });

  // Handle form submission
  const onSubmit = async (data: VideoUploadFormData) => {
    if (!selectedFile) return;

    const result = await uploadVideo(
      data.title,
      data.description,
      selectedFile
    );

    if (result.success) {
      // Reset form after successful upload
      reset();
      setSelectedFile(null);

      // Navigate to My Videos page after a short delay
      setTimeout(() => {
        navigate("/my-videos");
      }, 1500);
    }
  };

  // Handle cancel upload
  const handleCancelUpload = () => {
    cancelUpload();
  };

  return (
    <div className="upload-container">
      <h2>Upload Video</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="upload-form">
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            {...register("title")}
            disabled={isUploading}
          />
          {errors.title && (
            <span className="error-text">{errors.title.message}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            rows={4}
            {...register("description")}
            disabled={isUploading}
          />
          {errors.description && (
            <span className="error-text">{errors.description.message}</span>
          )}
        </div>

        <div className="form-group">
          <label>Video File</label>
          <div
            {...getRootProps()}
            className={`dropzone ${isDragActive ? "active" : ""} ${
              selectedFile ? "has-file" : ""
            }`}
          >
            <input {...getInputProps()} />
            {selectedFile ? (
              <div className="selected-file">
                <p className="file-name">{selectedFile.name}</p>
                <p className="file-size">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="dropzone-content">
                <p>Drag & drop a video file here, or click to select</p>
                <p className="dropzone-hint">Maximum file size: 1GB</p>
              </div>
            )}
          </div>
          {errors.file && (
            <span className="error-text">{errors.file.message}</span>
          )}
        </div>

        {uploadProgress && (
          <div className="upload-progress-container">
            <div className="progress-header">
              <span className="progress-label">
                {uploadProgress.status === "uploading" && "Uploading..."}
                {uploadProgress.status === "completed" && "Upload Complete!"}
                {uploadProgress.status === "failed" && "Upload Failed"}
                {uploadProgress.status === "canceled" && "Upload Canceled"}
              </span>
              <span className="progress-percentage">
                {uploadProgress.percentage}%
              </span>
            </div>

            <div className="progress-bar-container">
              <div
                className={`progress-bar ${uploadProgress.status}`}
                style={{ width: `${uploadProgress.percentage}%` }}
              />
            </div>

            <div className="progress-details">
              <span>
                {uploadProgress.uploadedParts} of {uploadProgress.totalParts}{" "}
                parts uploaded
              </span>

              {uploadProgress.status === "uploading" && (
                <button
                  type="button"
                  className="cancel-button"
                  onClick={handleCancelUpload}
                >
                  Cancel
                </button>
              )}
            </div>

            {uploadProgress.error && (
              <div className="error-message">{uploadProgress.error}</div>
            )}
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={() => navigate("/my-videos")}
            disabled={isUploading}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="submit-button"
            disabled={isUploading || !selectedFile}
          >
            {isUploading ? "Uploading..." : "Upload Video"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadVideoPage;
