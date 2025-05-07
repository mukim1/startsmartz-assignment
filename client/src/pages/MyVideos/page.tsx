import React, { useState } from "react";
import { Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import videoService from "@/services/api";
import type { Video } from "@/types";
import styles from "./style.module.css";
import VideoCard from "./VideoCard";
import { useNotification } from "@/context/NotificationContext";

const MyVideosPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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
    <div className={styles.container}>
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <h2>My Videos</h2>
          <p className={styles.videoCount}>
            {videos && videos.length > 0
              ? `${videos.length} video${videos.length !== 1 ? "s" : ""}`
              : "No videos yet"}
          </p>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewToggleButton} ${
                viewMode === "grid" ? styles.active : ""
              }`}
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
            </button>
            <button
              className={`${styles.viewToggleButton} ${
                viewMode === "list" ? styles.active : ""
              }`}
              onClick={() => setViewMode("list")}
              aria-label="List view"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
            </button>
          </div>
          <Link to="/upload-video" className={styles.uploadButton}>
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
            Upload
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinnerContainer}>
            <div className={styles.spinner}></div>
          </div>
          <p>Loading your videos...</p>
        </div>
      ) : error ? (
        <div className={styles.errorState}>
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
          <p>Error loading videos</p>
          <button
            className={styles.retryButton}
            onClick={() =>
              queryClient.invalidateQueries({ queryKey: ["userVideos"] })
            }
          >
            Try Again
          </button>
        </div>
      ) : videos && videos.length > 0 ? (
        <div
          className={viewMode === "grid" ? styles.videoGrid : styles.videoList}
        >
          {videos.map((video, index) => (
            <div
              key={video._id}
              className={styles.videoCardWrapper}
              style={{ "--card-index": index } as React.CSSProperties}
            >
              <VideoCard video={video} onDelete={openDeleteModal} />
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 12H2M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>
              <line x1="6" y1="16" x2="6.01" y2="16"></line>
              <line x1="10" y1="16" x2="10.01" y2="16"></line>
            </svg>
          </div>
          <h3>No videos yet</h3>
          <p>Upload your first video to get started</p>
          <Link to="/upload-video" className={styles.uploadEmptyButton}>
            Upload Your First Video
          </Link>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && selectedVideo && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <div className={styles.modalHeader}>
              <h3>Delete Video</h3>
              <button
                className={styles.modalCloseButton}
                onClick={closeDeleteModal}
                aria-label="Close modal"
              >
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
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.deleteWarning}>
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
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <p>
                  Are you sure you want to delete{" "}
                  <strong>"{selectedVideo.title}"</strong>? This action cannot
                  be undone.
                </p>
              </div>
            </div>

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
                {deleteMutation.isPending ? (
                  <>
                    <div className={styles.buttonSpinner}></div>
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyVideosPage;
