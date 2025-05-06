import React, { useState } from "react";
import { Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import videoService from "../services/api";
import type { Video } from "../types";
import "../styles/MyVideos.css";

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
    <div className="my-videos-container">
      <div className="page-header">
        <h2>My Videos</h2>
        <Link to="/upload-video" className="add-video-button">
          Upload New Video
        </Link>
      </div>

      {isLoading ? (
        <div className="loading-message">Loading videos...</div>
      ) : error ? (
        <div className="error-message">
          Error loading videos. Please try again.
        </div>
      ) : videos && videos.length > 0 ? (
        <div className="videos-grid">
          {videos.map((video) => (
            <div key={video._id} className="video-card">
              <div className="video-card-header">
                <h3 className="video-title">{video.title}</h3>
                <button
                  className="delete-button"
                  onClick={() => openDeleteModal(video)}
                  aria-label="Delete video"
                >
                  ×
                </button>
              </div>

              <div className="video-card-body">
                <p className="video-description">{video.description}</p>

                <div className="video-details">
                  <div className="video-detail">
                    <span className="detail-label">Size:</span>
                    <span className="detail-value">
                      {formatFileSize(video.size)}
                    </span>
                  </div>

                  <div className="video-detail">
                    <span className="detail-label">Uploaded:</span>
                    <span className="detail-value">
                      {formatDate(video.uploadedAt)}
                    </span>
                  </div>

                  <div className="video-detail">
                    <span className="detail-label">Filename:</span>
                    <span className="detail-value">{video.filename}</span>
                  </div>
                </div>
              </div>

              <div className="video-card-footer">
                <a
                  href={video.downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="view-button"
                >
                  View/Download
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-videos-message">
          <p>You haven't uploaded any videos yet.</p>
          <Link to="/upload-video" className="add-video-link">
            Upload your first video
          </Link>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteModal && selectedVideo && (
        <div className="modal-overlay">
          <div className="modal-container">
            <h3>Delete Video</h3>
            <p>
              Are you sure you want to delete "{selectedVideo.title}"? This
              action cannot be undone.
            </p>

            <div className="modal-actions">
              <button className="cancel-button" onClick={closeDeleteModal}>
                Cancel
              </button>

              <button
                className="delete-button"
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
