import { GetServerSideProps } from 'next';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { prisma } from '../lib/prisma';
import styles from './my-uploads.module.css';

interface PostData {
  id: string;
  imageUrl: string;
  thumbnailUrl?: string;
  tags: string[];
  mediaType: string;
  createdAt: string;
}

export default function MyUploads({ posts }: { posts: PostData[] }) {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className={styles.container}>
        <p>Please log in to view your uploads.</p>
        <Link href="/login">Login</Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>My Uploads</h1>
      <div className={styles.uploadGrid}>
        {posts.map(post => (
          <div key={post.id} className={styles.uploadCard}>
            <div className={styles.thumbnail}>
              {post.mediaType === 'video' ? (
                <video poster={post.thumbnailUrl}>
                  <source src={post.imageUrl} type="video/mp4" />
                </video>
              ) : (
                <img src={post.thumbnailUrl || post.imageUrl} alt="" />
              )}
            </div>
            <div className={styles.actions}>
              <Link 
                href={`/edit-post?id=${post.id}`}
                className={styles.editButton}
              >
                Edit
              </Link>
              <button 
                onClick={() => handleDelete(post.id)}
                className={styles.deleteButton}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  const session = await getSession({ req });
  
  if (!session?.user?.email) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  const posts = await prisma.post.findMany({
    where: {
      user: {
        email: session.user.email
      }
    },
    select: {
      id: true,
      imageUrl: true,
      thumbnailUrl: true,
      tags: true,
      mediaType: true,
      createdAt: true
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