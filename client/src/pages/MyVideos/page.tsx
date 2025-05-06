import React, { useState } from "react";
import { Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import videoService from "@/services/api";
import type { Video } from "@/types";
import styles from "./style.module.css";
import { useNotification } from "@/context/NotificationContext";

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const MyVideosPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { showNotification } = useNotification();

  // Fetch videos
  const {
    data: videos,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["userVideos"],
    queryFn: videoService.getUserVideos,
  });

  // Delete video mutation
  const deleteMutation = useMutation({
    mutationFn: videoService.deleteVideo,
    onSuccess: () => {
      // Refetch videos after successful deletion
      queryClient.invalidateQueries({ queryKey: ["userVideos"] });
      closeDeleteModal();

      // Show success notification
      showNotification(
        "success",
        "Video Deleted",
        selectedVideo
          ? `"${selectedVideo.title}" was deleted successfully`
          : "Video was deleted successfully"
      );
    },
    onError: (error: any) => {
      // Show error notification
      showNotification(
        "error",
        "Delete Failed",
        error.message || "Failed to delete the video. Please try again."
      );
    },
  });

  // Open delete confirmation modal
  const openDeleteModal = (video: Video) => {
    setSelectedVideo(video);
    setShowDeleteModal(true);
  };

  // Close delete confirmation modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedVideo(null);
  };

  // Handle delete video
  const handleDeleteVideo = () => {
    if (selectedVideo) {
      deleteMutation.mutate(selectedVideo._id);
    }
  };

  return (
    <div className={styles.myVideosContainer}>
      <div className={styles.pageHeader}>
        <h2>My Videos</h2>
        <Link to="/upload-video" className={styles.addVideoButton}>
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
            <path d="M12 5v14M5 12h14" />
          </svg>
          Upload New Video
        </Link>
      </div>

      {isLoading ? (
        <div className={styles.loadingMessage}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-spin"
          >
            <circle cx="12" cy="12" r="10" className="opacity-25" />
            <path d="M12 2a10 10 0 1 0 10 10H12V2z" className="opacity-75" />
          </svg>
          Loading videos...
        </div>
      ) : error ? (
        <div className={styles.errorMessage}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12" y2="16" />
          </svg>
          Error loading videos. Please try again.
        </div>
      ) : videos && videos.length > 0 ? (
        <div className={styles.videosGrid}>
          {videos.map((video) => (
            <div key={video._id} className={styles.videoCard}>
              <div className={styles.videoCardHeader}>
                <h3 className={styles.videoTitle}>{video.title}</h3>
                <button
                  className={styles.deleteButton}
                  onClick={() => openDeleteModal(video)}
                  aria-label="Delete video"
                >
                  ×
                </button>
              </div>

              <div className={styles.videoCardBody}>
                <p className={styles.videoDescription}>{video.description}</p>

                <div className={styles.videoDetails}>
                  <div className={styles.videoDetail}>
                    <span className={styles.detailLabel}>Size:</span>
                    <span className={styles.detailValue}>
                      {formatFileSize(video.size)}
                    </span>
                  </div>

                  <div className={styles.videoDetail}>
                    <span className={styles.detailLabel}>Uploaded:</span>
                    <span className={styles.detailValue}>
                      {formatDate(video.uploadedAt)}
                    </span>
                  </div>

                  <div className={styles.videoDetail}>
                    <span className={styles.detailLabel}>Filename:</span>
                    <span className={styles.detailValue}>{video.filename}</span>
                  </div>
                </div>
              </div>

              <div className={styles.videoCardFooter}>
                <a
                  href={video.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.viewButton}
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
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  View/Download
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.noVideosMessage}>
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
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
            <line x1="7" y1="2" x2="7" y2="22" />
            <line x1="17" y1="2" x2="17" y2="22" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <line x1="2" y1="7" x2="7" y2="7" />
            <line x1="2" y1="17" x2="7" y2="17" />
            <line x1="17" y1="17" x2="22" y2="17" />
            <line x1="17" y1="7" x2="22" y2="7" />
          </svg>
          <p>You haven't uploaded any videos yet.</p>
          <Link to="/upload-video" className={styles.addVideoLink}>
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
              <path d="M12 5v14M5 12h14" />
            </svg>
            Upload your first video
          </Link>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && selectedVideo && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <h3>Delete Video</h3>
            <p>
              Are you sure you want to delete "{selectedVideo.title}"? This
              action cannot be undone.
            </p>

            <div className={styles.modalActions}>
              <button
                className={styles.cancelButton}
                onClick={closeDeleteModal}
              >
                Cancel
              </button>

              <button
                className={styles.deleteButton}
                onClick={handleDeleteVideo}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyVideosPage;
