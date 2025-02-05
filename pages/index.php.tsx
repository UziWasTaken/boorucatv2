import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { prisma } from '../lib/prisma';
import styles from './index.module.css';

interface PostData {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;
  tags: string[];
  mediaType: string;
}

export default function PHPPage({ posts }: { posts: PostData[] }) {
  const router = useRouter();
  const { page, s, tags: queryTags } = router.query;

  // Handle PHP-style routing
  if (page === 'post' && s === 'list') {
    return (
      <div className={styles.contentWithSidebar}>
        <aside className={styles.sidebar}>
          <div className={styles.searchSection}>
            <form action="/index.php" method="get">
              <input type="hidden" name="page" value="post" />
              <input type="hidden" name="s" value="list" />
              <input 
                type="text" 
                name="tags" 
                placeholder="Search tags..." 
                defaultValue={queryTags}
              />
              <button type="submit">Search</button>
            </form>
          </div>
        </aside>

        <main className={styles.mainContent}>
          <div className={styles.postsGrid}>
            {posts.map(post => (
              <div 
                key={post.id} 
                className={styles.postThumbnail}
                data-type={post.mediaType}
              >
                <Link href={`/index.php?page=post&s=view&id=${post.id}`}>
                  <img 
                    src={post.thumbnailUrl || post.imageUrl} 
                    alt={post.tags.join(' ')}
                    className={styles.thumbnailImage}
                    loading="lazy"
                  />
                </Link>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Default landing page
  return (
    <div className={styles.container}>
      <div className={styles.searchBox}>
        <input type="text" placeholder="Enter tags to search" />
        <button>Search</button>
      </div>
      <div className={styles.stats}>
        <p>Running Kazuto Beta 0.2.0</p>
        <p>Total posts: {posts.length}</p>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const { page, s, tags } = query;
  
  let where = {};
  if (tags) {
    where = {
      tags: {
        hasSome: typeof tags === 'string' ? [tags] : tags
      }
    };
  }

  const posts = await prisma.post.findMany({
    where,
    select: {
      id: true,
      imageUrl: true,
      thumbnailUrl: true,
      tags: true,
      mediaType: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  return {
    props: {
      posts: JSON.parse(JSON.stringify(posts))
    }
  };
}; 