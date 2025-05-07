import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDropzone } from "react-dropzone";
import { useVideoUpload } from "@/hooks/useVideoUpload";
import styles from "./style.module.css";
import {
  videoUploadSchema,
  type VideoUploadFormData,
} from "@/validation/schema";
import { useNotification } from "@/context/NotificationContext";
import { useQueryClient } from "@tanstack/react-query";

const calculateTimeRemaining = (
  uploadedBytes: number,
  totalBytes: number,
  uploadSpeed: number
): string => {
  if (uploadSpeed === 0) return "Calculating...";

  const remainingBytes = totalBytes - uploadedBytes;
  const remainingSeconds = remainingBytes / uploadSpeed;

  if (remainingSeconds < 60) {
    return `${Math.round(remainingSeconds)} seconds remaining`;
  } else if (remainingSeconds < 3600) {
    return `${Math.round(remainingSeconds / 60)} minutes remaining`;
  } else {
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.round((remainingSeconds % 3600) / 60);
    return `${hours}h ${minutes}m remaining`;
  }
};

const formatSpeed = (bytesPerSecond: number): string => {
  if (bytesPerSecond < 1024) {
    return `${Math.round(bytesPerSecond)} B/s`;
  } else if (bytesPerSecond < 1024 * 1024) {
    return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
  } else {
    return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
  }
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const UploadVideoPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Additional states for enhanced progress tracking
  const [uploadSpeed, setUploadSpeed] = useState<number>(0);
  const [uploadedBytes, setUploadedBytes] = useState<number>(0);
  const prevUploadedBytesRef = useRef<number>(0);
  const speedIntervalRef = useRef<number | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
    watch,
  } = useForm<VideoUploadFormData>({
    resolver: zodResolver(videoUploadSchema),
  });

  // Watch form values for validation feedback
  const title = watch("title");
  const description = watch("description");

  const { uploadVideo, cancelUpload, uploadProgress, isUploading } =
    useVideoUpload();

  // Calculate upload speed and uploaded bytes
  useEffect(() => {
    if (isUploading && uploadProgress && selectedFile) {
      // Start speed calculation interval
      if (!speedIntervalRef.current) {
        prevUploadedBytesRef.current = 0;
        speedIntervalRef.current = window.setInterval(() => {
          const chunkSize = selectedFile.size / uploadProgress.totalParts;
          const currentUploadedBytes = uploadProgress.uploadedParts * chunkSize;
          setUploadedBytes(currentUploadedBytes);

          // Calculate speed (bytes per second)
          const bytesUploaded =
            currentUploadedBytes - prevUploadedBytesRef.current;
          const speed = bytesUploaded / 1; // 1 second interval

          // Apply some smoothing to the speed calculation
          setUploadSpeed((prev) => prev * 0.7 + speed * 0.3);

          prevUploadedBytesRef.current = currentUploadedBytes;
        }, 1000);
      }
    } else {
      // Clear interval when not uploading
      if (speedIntervalRef.current) {
        clearInterval(speedIntervalRef.current);
        speedIntervalRef.current = null;
      }
    }

    return () => {
      if (speedIntervalRef.current) {
        clearInterval(speedIntervalRef.current);
      }
    };
  }, [isUploading, uploadProgress, selectedFile]);

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
  const { showNotification } = useNotification();
  const onSubmit = async (data: VideoUploadFormData) => {
    if (!selectedFile) {
      setUploadError("Please select a video file to upload");
      showNotification(
        "error",
        "Upload Error",
        "Please select a video file to upload"
      );
      return;
    }

    setUploadError(null);
    console.log("Starting upload for file:", selectedFile.name);

    // Show notification for upload start
    showNotification(
      "info",
      "Upload Started",
      `Uploading ${selectedFile.name}`
    );

    try {
      const result = await uploadVideo(
        data.title,
        data.description,
        selectedFile
      );

      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["userVideos"] });
        console.log("Upload completed successfully!");
        // Reset form after successful upload
        reset();
        setSelectedFile(null);

        // Show success notification
        showNotification(
          "success",
          "Upload Complete",
          "Your video was uploaded successfully!"
        );

        // Navigate to My Videos page after a short delay
        setTimeout(() => {
          navigate("/my-videos");
        }, 1500);
      } else {
        console.error("Upload failed:", result.error || result.status);
        setUploadError(result.error || "Upload failed, please try again");

        // Show error notification
        showNotification(
          "error",
          "Upload Failed",
          result.error || "Upload failed, please try again"
        );
      }
    } catch (error: any) {
      console.error("Unexpected upload error:", error);
      setUploadError(error.message || "An unexpected error occurred");

      // Show error notification
      showNotification(
        "error",
        "Upload Error",
        error.message || "An unexpected error occurred"
      );
    }
  };

  // Handle cancel upload
  const handleCancelUpload = () => {
    console.log("Cancel upload requested by user");
    cancelUpload();
  };

  return (
    <div className={styles.uploadContainer}>
      <div className={styles.uploadHeader}>
        <h2>Upload Video</h2>
        <p className={styles.uploadSubtitle}>Share your video with the world</p>
      </div>

      {uploadError && (
        <div className={styles.errorMessage}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          {uploadError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className={styles.uploadForm}>
        <div className={styles.formLayout}>
          <div className={styles.formColumn}>
            <div className={styles.formSection}>
              <div className={styles.formGroup}>
                <label htmlFor="title">
                  Title
                  <span className={styles.requiredField}>*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  className={`${errors.title ? styles.inputError : ""} ${
                    title && !errors.title ? styles.inputValid : ""
                  }`}
                  {...register("title")}
                  disabled={isUploading}
                  placeholder="Enter a descriptive title"
                />
                {errors.title ? (
                  <span className={styles.errorText}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    {errors.title.message}
                  </span>
                ) : title ? (
                  <span className={styles.validText}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Looks good!
                  </span>
                ) : null}
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="description">
                  Description
                  <span className={styles.requiredField}>*</span>
                </label>
                <textarea
                  id="description"
                  rows={5}
                  className={`${errors.description ? styles.inputError : ""} ${
                    description && !errors.description ? styles.inputValid : ""
                  }`}
                  {...register("description")}
                  disabled={isUploading}
                  placeholder="Describe your video content"
                ></textarea>
                {errors.description ? (
                  <span className={styles.errorText}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    {errors.description.message}
                  </span>
                ) : description ? (
                  <span className={styles.validText}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    Looks good!
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className={styles.formColumn}>
            <div className={styles.formSection}>
              <div className={styles.formGroup}>
                <label>
                  Video File
                  <span className={styles.requiredField}>*</span>
                </label>
                <div
                  {...getRootProps()}
                  className={`${styles.dropzone} ${
                    isDragActive ? styles.active : ""
                  } ${selectedFile ? styles.hasFile : ""} ${
                    errors.file ? styles.error : ""
                  }`}
                >
                  <input {...getInputProps()} />
                  {selectedFile ? (
                    <div className={styles.selectedFile}>
                      <div className={styles.filePreview}>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="36"
                          height="36"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polygon points="23 7 16 12 23 17 23 7"></polygon>
                          <rect
                            x="1"
                            y="5"
                            width="15"
                            height="14"
                            rx="2"
                            ry="2"
                          ></rect>
                        </svg>
                      </div>
                      <div className={styles.fileInfo}>
                        <p className={styles.fileName}>{selectedFile.name}</p>
                        <p className={styles.fileSize}>
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        className={styles.removeFileButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setValue("file", undefined as any);
                        }}
                        disabled={isUploading}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className={styles.dropzoneContent}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                      {isDragActive ? (
                        <p>Drop your video file here</p>
                      ) : (
                        <>
                          <p>Drag & drop your video file here</p>
                          <p className={styles.dropzoneOr}>or</p>
                          <button type="button" className={styles.browseButton}>
                            Browse Files
                          </button>
                        </>
                      )}
                      <p className={styles.dropzoneHint}>
                        Maximum file size: 1GB
                      </p>
                    </div>
                  )}
                </div>
                {errors.file && (
                  <span className={styles.errorText}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    {errors.file.message}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {uploadProgress && (
          <div
            className={`${styles.uploadProgressContainer} ${
              styles[uploadProgress.status]
            }`}
          >
            <div className={styles.progressHeader}>
              <span className={styles.progressLabel}>
                {uploadProgress.status === "uploading" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={styles.uploadingIcon}
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                )}
                {uploadProgress.status === "completed" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                )}
                {uploadProgress.status === "failed" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </svg>
                )}
                {uploadProgress.status === "canceled" && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                )}
                {uploadProgress.status === "uploading" && "Uploading..."}
                {uploadProgress.status === "completed" && "Upload Complete!"}
                {uploadProgress.status === "failed" && "Upload Failed"}
                {uploadProgress.status === "canceled" && "Upload Canceled"}
              </span>
              <span className={styles.progressPercentage}>
                {uploadProgress.percentage}%
              </span>
            </div>

            <div className={styles.progressBarContainer}>
              <div className={styles.progressBarBg} />
              <div
                className={`${styles.progressBar} ${
                  styles[uploadProgress.status]
                }`}
                style={{ width: `${uploadProgress.percentage}%` }}
              />
            </div>

            <div className={styles.progressDetails}>
              <div className={styles.progressInfo}>
                <span>
                  {uploadProgress.uploadedParts} of {uploadProgress.totalParts}{" "}
                  parts
                </span>
                {selectedFile && uploadProgress.status === "uploading" && (
                  <span className={styles.progressSpeed}>
                    {formatSpeed(uploadSpeed)}
                  </span>
                )}
              </div>

              <div className={styles.progressInfo}>
                {selectedFile && uploadProgress.status === "uploading" && (
                  <>
                    <span>
                      {(uploadedBytes / (1024 * 1024)).toFixed(1)} MB /{" "}
                      {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                    <span className={styles.progressTime}>
                      {calculateTimeRemaining(
                        uploadedBytes,
                        selectedFile.size,
                        uploadSpeed
                      )}
                    </span>
                  </>
                )}
              </div>
            </div>

            {uploadProgress.status === "uploading" && (
              <button
                type="button"
                className={styles.cancelButton}
                onClick={handleCancelUpload}
                style={{ marginTop: "12px" }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
                Cancel Upload
              </button>
            )}

            {uploadProgress.error && (
              <div
                className={styles.errorMessage}
                style={{ marginTop: "12px" }}
              >
                {uploadProgress.error}
              </div>
            )}
          </div>
        )}

        <div className={styles.formActions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={() => navigate("/my-videos")}
            disabled={isUploading}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back to My Videos
          </button>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isUploading || !selectedFile}
          >
            {isUploading ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={styles.uploadingSpinner}
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Upload Video
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadVideoPage;
