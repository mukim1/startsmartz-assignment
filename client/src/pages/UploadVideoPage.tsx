import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropzone } from "react-dropzone";
import { useVideoUpload } from "../hooks/useVideoUpload";
import "../styles/UploadVideo.css";
import {
  videoUploadSchema,
  type VideoUploadFormData,
} from "../validation/schema";

const UploadVideoPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

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
      console.log("File selected:", file.name, file.size, file.type);
      setSelectedFile(file);
      setValue("file", file);
      setUploadError(null); // Clear any previous errors
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
    if (!selectedFile) {
      setUploadError("Please select a video file to upload");
      return;
    }

    setUploadError(null);
    console.log("Starting upload for file:", selectedFile.name);
    
    try {
      const result = await uploadVideo(
        data.title,
        data.description,
        selectedFile
      );

      if (result.success) {
        console.log("Upload completed successfully!");
        // Reset form after successful upload
        reset();
        setSelectedFile(null);

        // Navigate to My Videos page after a short delay
        setTimeout(() => {
          navigate("/my-videos");
        }, 1500);
      } else {
        console.error("Upload failed:", result.error || result.status);
        setUploadError(result.error || "Upload failed, please try again");
      }
    } catch (error: any) {
      console.error("Unexpected upload error:", error);
      setUploadError(error.message || "An unexpected error occurred");
    }
  };

  // Handle cancel upload
  const handleCancelUpload = () => {
    console.log("Cancel upload requested by user");
    cancelUpload();
  };

  return (
    <div className="upload-container">
      <h2>Upload Video</h2>

      {uploadError && (
        <div className="error-message">{uploadError}</div>
      )}

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