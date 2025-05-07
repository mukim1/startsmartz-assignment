import React from "react";
import { formatDistance } from "date-fns";
import styles from "./videoCard.module.css";

interface VideoCardProps {
  video: {
    _id: string;
    title: string;
    description: string;
    filename: string;
    size: number;
    uploadedAt: string;
    downloadUrl?: string;
  };
  onDelete: (video: any) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const VideoCard: React.FC<VideoCardProps> = ({ video, onDelete }) => {
  // Calculate time ago
  const timeAgo = formatDistance(new Date(video.uploadedAt), new Date(), {
    addSuffix: true,
  });

  // Estimate video duration (rough approximation based on size)
  const estimateDuration = (size: number): string => {
    // Roughly estimating 10MB per minute at medium quality
    const minutes = Math.round(size / (10 * 1024 * 1024));
    if (minutes < 1) return "< 1 min";
    if (minutes < 60) return `${minutes} min`;
    return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  return (
    <div className={styles.videoCard}>
      <div className={styles.thumbnailContainer}>
        <div className={styles.thumbnail}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="23 7 16 12 23 17 23 7"></polygon>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
          </svg>
        </div>
        <div className={styles.duration}>{estimateDuration(video.size)}</div>
        <a
          href={video.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.playButton}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              fill="currentColor"
              opacity="0.8"
            ></circle>
            <polygon points="10 8 16 12 10 16 10 8" fill="#0a192f"></polygon>
          </svg>
        </a>
      </div>

      <div className={styles.videoInfo}>
        <h3 className={styles.videoTitle} title={video.title}>
          {video.title}
        </h3>
        <p className={styles.videoMeta}>
          {formatFileSize(video.size)} • {timeAgo}
        </p>
      </div>

      <div className={styles.cardActions}>
        <a
          href={video.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.actionButton}
          title="View video"
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
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </a>
        <button
          onClick={() => onDelete(video)}
          className={styles.actionButton}
          title="Delete video"
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
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default VideoCard;
