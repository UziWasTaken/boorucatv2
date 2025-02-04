import React from 'react';
import Link from 'next/link';
import { VideoPlayer } from './VideoPlayer';

interface PostProps {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;
  mediaType?: string;
  duration?: number;
  tags?: string[];
}

export const Post: React.FC<PostProps> = ({ 
  id, 
  imageUrl, 
  thumbnailUrl, 
  mediaType = 'image',
  duration,
  tags = []
}) => {
  return (
    <div className="post">
      <Link href={`/posts/${id}`}>
        {mediaType === 'video' ? (
          <VideoPlayer
            src={imageUrl}
            thumbnailUrl={thumbnailUrl}
            duration={duration}
          />
        ) : (
          <img 
            src={imageUrl} 
            alt={`Post ${id}`}
            loading="lazy"
          />
        )}
      </Link>
      {tags.length > 0 && (
        <div className="tags">
          {tags.map(tag => (
            <Link 
              key={tag} 
              href={`/posts?tags=${tag}`}
              className="tag"
            >
              {tag}
            </Link>
          ))}
        </div>
      )}
      <style jsx>{`
        .post {
          position: relative;
          margin-bottom: 1rem;
        }

        img {
          max-width: 100%;
          height: auto;
          display: block;
        }

        .tags {
          margin-top: 0.5rem;
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .tag {
          background: #f0f0f0;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.875rem;
          color: #333;
          text-decoration: none;
        }

        .tag:hover {
          background: #e0e0e0;
        }
      `}</style>
    </div>
  );
}; 