import type { NextPage, GetServerSideProps } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../api/auth/[...nextauth]'
import { prisma } from '../../lib/prisma'
import styles from './Post.module.css'
import { useRouter } from 'next/router'
import { VideoPlayer } from '../../components/VideoPlayer'
import { transformCloudinaryUrl } from '../../utils/url'

interface Post {
  id: string
  imageUrl: string
  thumbnailUrl?: string | null
  mediaType: 'image' | 'video'
  duration?: number | null
  tags: string[]
  source: string | null
  createdAt: Date
  user: {
    username: string
  }
  userId: string
}

interface PostPageProps {
  post: Post
}

export const getServerSideProps: GetServerSideProps = async ({ query, params }) => {
  // Get ID from either query or params
  const postId = query.id || params?.id

  if (!postId) {
    return {
      notFound: true
    }
  }

  const post = await prisma.post.findUnique({
    where: {
      id: postId as string
    },
    include: {
      user: {
        select: {
          username: true
        }
      }
    }
  })

  if (!post) {
    return {
      notFound: true
    }
  }

  const postWithPublicUrls = {
    ...post,
    imageUrl: transformCloudinaryUrl(post.imageUrl) || post.imageUrl,
    thumbnailUrl: post.thumbnailUrl ? transformCloudinaryUrl(post.thumbnailUrl) : null
  }

  return {
    props: {
      post: JSON.parse(JSON.stringify(postWithPublicUrls))
    }
  }
}

const PostPage: NextPage<PostPageProps> = ({ post }) => {
  const { data: session } = useSession()
  const isOwner = session?.user?.id === post.userId
  const router = useRouter()

  const handleDelete = async (postId: string) => {
    if (confirm('Are you sure you want to delete this post?')) {
      try {
        const res = await fetch(`/api/posts/${postId}`, {
          method: 'DELETE'
        })

        if (!res.ok) throw new Error('Failed to delete post')

        router.push('/posts')
      } catch (error) {
        console.error('Error deleting post:', error)
      }
    }
  }

  return (
    <>
      <Head>
        <title>{post.tags.join(', ')} - Kazuru</title>
      </Head>
      <div className={styles.postPageLayout}>
        <div className={styles.sidebar}>
          <div className={styles.postInfo}>
            <h3>Information</h3>
            <table className={styles.infoTable}>
              <tbody>
                <tr>
                  <td>ID:</td>
                  <td>{post.id}</td>
                </tr>
                <tr>
                  <td>Posted:</td>
                  <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td>By:</td>
                  <td>{post.user.username}</td>
                </tr>
                {post.source && (
                  <tr>
                    <td>Source:</td>
                    <td>
                      <a href={post.source} target="_blank" rel="noopener noreferrer">
                        {post.source}
                      </a>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <h3>Tags</h3>
            <div className={styles.tagsList}>
              {post.tags.map((tag) => (
                <Link 
                  key={tag} 
                  href={{
                    pathname: '/index.php',
                    query: {
                      page: 'post',
                      s: 'list',
                      tags: tag
                    }
                  }}
                  className={styles.tag}
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.mainContent}>
          {post.mediaType === 'video' ? (
            <VideoPlayer
              src={post.imageUrl}
              poster={post.thumbnailUrl || undefined}
              className={styles.media}
            />
          ) : (
            <Image
              src={post.imageUrl}
              alt={post.tags.join(', ')}
              width={800}
              height={800}
              className={styles.media}
            />
          )}
        </div>
      </div>
    </>
  )
}

export default PostPage 