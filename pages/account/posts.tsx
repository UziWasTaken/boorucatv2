import type { NextPage, GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../api/auth/[...nextauth]'
import { prisma } from '../../lib/prisma'
import styles from './Posts.module.css'

interface Post {
  id: string
  imageUrl: string
  tags: string[]
  source: string | null
  createdAt: Date
}

interface UserPostsProps {
  posts: Post[]
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)
  
  if (!session) {
    return {
      redirect: {
        destination: '/account',
        permanent: false,
      },
    }
  }

  const posts = await prisma.post.findMany({
    where: {
      userId: session.user.id
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return {
    props: {
      posts: JSON.parse(JSON.stringify(posts))
    }
  }
}

const UserPosts: NextPage<UserPostsProps> = ({ posts }) => {
  const { data: session } = useSession()

  const handleDelete = async (postId: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      try {
        const res = await fetch(`/api/posts/${postId}`, {
          method: 'DELETE'
        })

        if (!res.ok) throw new Error('Failed to delete post')

        // Refresh the page to show updated posts
        window.location.reload()
      } catch (error) {
        console.error('Error deleting post:', error)
      }
    }
  }

  return (
    <>
      <Head>
        <title>My Posts - Kazuru</title>
      </Head>
      <div id="content">
        <div className={styles.postsContainer}>
          <div className={styles.postsHeader}>
            <h2>My Posts</h2>
            <Link href="/upload" className={styles.uploadButton}>
              Upload New Post
            </Link>
          </div>
          <div className={styles.postsGrid}>
            {posts.length > 0 ? (
              posts.map((post) => (
                <div key={post.id} className={styles.postCard}>
                  <Link href={`/posts/${post.id}`}>
                    <div className={styles.imageContainer}>
                      <Image
                        src={post.imageUrl}
                        alt={post.tags.join(', ')}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className={styles.image}
                      />
                    </div>
                  </Link>
                  <div className={styles.postInfo}>
                    <div className={styles.tags}>
                      {post.tags.map((tag) => (
                        <span key={tag} className={styles.tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div className={styles.postActions}>
                      <Link href={`/posts/${post.id}/edit`} className={styles.editButton}>
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
                </div>
              ))
            ) : (
              <div className={styles.noResults}>
                No posts found
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default UserPosts 