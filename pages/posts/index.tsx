import { useState } from 'react';
import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { prisma } from '../../lib/prisma';
import styles from './Posts.module.css';
import { Post } from '../../components/Post';

interface PostData {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;
  mediaType: string;
  duration?: number;
  tags: string[];
}

interface Props {
  posts: PostData[];
  tags: {
    copyright: Array<{name: string, count: number}>;
    artist: Array<{name: string, count: number}>;
    general: Array<{name: string, count: number}>;
  };
}

export default function Posts({ posts, tags }: Props) {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className={styles.contentWithSidebar}>
      <aside className={styles.sidebar}>
        <div className={styles.searchSection}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tags..."
          />
          <button>Search</button>
        </div>

        <div className={styles.tagCategories}>
          <div className={styles.tagCategory}>
            <h4>Copyright</h4>
            {tags.copyright.map(tag => (
              <div key={tag.name} className={styles.tagItem}>
                <span className={styles.tagOperator}>?</span>
                <Link href={`/posts?tags=${tag.name}`} className={styles.tagLink}>
                  {tag.name}
                </Link>
                <span className={styles.tagCount}>{tag.count}</span>
              </div>
            ))}
          </div>

          <div className={styles.tagCategory}>
            <h4>Artist</h4>
            {tags.artist.map(tag => (
              <div key={tag.name} className={styles.tagItem}>
                <span className={styles.tagOperator}>?</span>
                <Link href={`/posts?tags=${tag.name}`} className={styles.tagLink}>
                  {tag.name}
                </Link>
                <span className={styles.tagCount}>{tag.count}</span>
              </div>
            ))}
          </div>

          <div className={styles.tagCategory}>
            <h4>General</h4>
            {tags.general.map(tag => (
              <div key={tag.name} className={styles.tagItem}>
                <span className={styles.tagOperator}>?</span>
                <Link href={`/posts?tags=${tag.name}`} className={styles.tagLink}>
                  {tag.name}
                </Link>
                <span className={styles.tagCount}>{tag.count}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <div className={styles.postsGrid}>
          {posts.map(post => (
            <Post key={post.id} {...post} />
          ))}
        </div>
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const posts = await prisma.post.findMany({
    select: {
      id: true,
      imageUrl: true,
      thumbnailUrl: true,
      mediaType: true,
      duration: true,
      tags: true,
      createdAt: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  // Calculate tag counts from posts
  const tagCounts = posts.reduce((acc, post) => {
    post.tags.forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  // Categorize tags (you can implement your own categorization logic)
  const tags = {
    copyright: Object.entries(tagCounts)
      .filter(([tag]) => tag.startsWith('copyright:'))
      .map(([name, count]) => ({ name, count })),
    artist: Object.entries(tagCounts)
      .filter(([tag]) => tag.startsWith('artist:'))
      .map(([name, count]) => ({ name, count })),
    general: Object.entries(tagCounts)
      .filter(([tag]) => !tag.startsWith('copyright:') && !tag.startsWith('artist:'))
      .map(([name, count]) => ({ name, count }))
  };

  return {
    props: {
      posts: JSON.parse(JSON.stringify(posts)),
      tags
    }
  };
};