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

interface SinglePostData extends PostData {
  user: {
    username: string;
  };
}

interface Props {
  posts: PostData[];
  singlePost?: SinglePostData;
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

  // Handle single post view
  if (page === 'post' && s === 'view') {
    const post = posts.find(p => p.id === queryTags);
    if (!post) return <div>Post not found</div>;

    return (
      <div className={styles.postView}>
        <div className={styles.postContent}>
          {post.mediaType === 'video' ? (
            <video 
              controls
              className={styles.videoPlayer}
              poster={post.thumbnailUrl}
            >
              <source src={post.imageUrl} type="video/mp4" />
              Your browser does not support video playback.
            </video>
          ) : (
            <img 
              src={post.imageUrl} 
              alt={post.tags.join(' ')} 
              className={styles.postImage}
            />
          )}
        </div>
        <div className={styles.postInfo}>
          <h3>Information</h3>
          <div className={styles.postDetails}>
            <p>Posted by: {post.user.username}</p>
            <p>Posted: {new Date(post.createdAt).toLocaleString()}</p>
          </div>
          <div className={styles.postTags}>
            <h4>Tags</h4>
            <div className={styles.tagList}>
              {post.tags.map(tag => (
                <Link 
                  key={tag}
                  href={`/index.php?page=post&s=list&tags=${tag}`}
                  className={styles.tag}
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </div>
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