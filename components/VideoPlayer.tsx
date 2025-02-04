import React from 'react';

interface VideoPlayerProps {
  src: string;
  thumbnailUrl?: string;
  duration?: number;
  poster?: string;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  src, 
  thumbnailUrl, 
  duration,
  poster,
  className = ''
}) => {
  return (
    <div className={`video-container ${className}`}>
      <video 
        controls
        preload="metadata"
        poster={poster || thumbnailUrl}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      {duration && (
        <div className="duration">
          {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}
        </div>
      )}
      <style jsx>{`
        .video-container {
          position: relative;
          width: 100%;
          max-width: 100%;
        }
        
        video {
          width: 100%;
          height: auto;
          max-height: 80vh;
          object-fit: contain;
        }
        
        .duration {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          padding: 2px 4px;
          border-radius: 2px;
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
}; 