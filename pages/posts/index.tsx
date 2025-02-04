import type { NextPage, GetServerSideProps } from 'next'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '../../lib/prisma'
import styles from './Posts.module.css'
import { Post } from '../../components/Post'
import { transformCloudinaryUrl } from '../../utils/url'

interface Post {
  id: string
  imageUrl: string
  thumbnailUrl?: string | null
  mediaType: 'image' | 'video'
  duration?: number | null
  tags: string[]
  source: string | null
  userId: string
  createdAt: string
  user?: {
    username?: string | null
    email?: string | null
  }
}

interface TagCount {
  tag: string
  count: number
}

interface PostsPageProps {
  posts: Post[]
  tagCounts: TagCount[]
  searchTags: string[]
  pagination: {
    current: number
    total: number
    pid: number
  }
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  // Handle both legacy and new URL parameters
  const { page: pageParam, s, tags: queryTags, pid } = query
  
  // Calculate page number from either pid or page parameter
  const page = pid ? Math.floor(parseInt(pid as string) / 42) + 1 
    : parseInt(pageParam as string) || 1
  
  const limit = 42
  const offset = (page - 1) * limit
  
  // Handle tags from either format
  const searchTags = queryTags ? 
    (typeof queryTags === 'string' ? queryTags.split(' ') : queryTags).filter(Boolean) 
    : []

  // Build the where clause for the query
  const where = searchTags.length > 0 ? {
    tags: {
      hasEvery: searchTags
    }
  } : {}

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      select: {
        id: true,
        imageUrl: true,
        thumbnailUrl: true,
        mediaType: true,
        duration: true,
        tags: true,
        source: true,
        userId: true,
        createdAt: true,
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    }),
    prisma.post.count({ where })
  ])

  // Get tag counts only from filtered posts
  const allTags = posts.flatMap(post => post.tags)
  const tagCounts = Object.entries(
    allTags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  ).map(([tag, count]) => ({ tag, count }))

  // Format URLs to use your domain
  const postsWithPublicUrls = posts.map(post => ({
    ...post,
    imageUrl: transformCloudinaryUrl(post.imageUrl) || post.imageUrl,
    thumbnailUrl: post.thumbnailUrl ? transformCloudinaryUrl(post.thumbnailUrl) : null
  }))

  return {
    props: {
      posts: JSON.parse(JSON.stringify(postsWithPublicUrls)),
      tagCounts: tagCounts,
      searchTags,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        pid: offset
      }
    }
  }
}

const PostsPage: NextPage<PostsPageProps> = ({ posts, tagCounts, searchTags, pagination }) => {
  return (
    <>
      <Head>
        <title>{searchTags?.length ? searchTags.join(' ') + ' - ' : ''}Posts - Kazuru</title>
      </Head>
      <div id="content" className={styles.contentWithSidebar}>
        <div className={styles.sidebar}>
          <div className={styles.searchSection}>
            <h3>Search</h3>
            <form action="/index.php" method="get">
              <input type="hidden" name="page" value="post" />
              <input type="hidden" name="s" value="list" />
              <input 
                type="text" 
                name="tags" 
                placeholder="Search tags..." 
                defaultValue={searchTags?.join(' ')}
              />
              <button type="submit">Search</button>
            </form>
          </div>

          <div className={styles.tagsSection}>
            <h3>Tags</h3>
            <div className={styles.tagCategories}>
              <div className={styles.tagCategory}>
                <h4>Copyright</h4>
                {tagCounts
                  .filter(({ tag }) => tag.startsWith('copyright:'))
                  .map(({ tag, count }) => (
                    <div key={tag} className={styles.tagItem}>
                      <span className={styles.tagOperator}>+</span>
                      <Link 
                        href={`/index.php?page=post&s=list&tags=${tag}`} 
                        className={styles.tagLink}
                      >
                        {tag.replace('copyright:', '')}
                      </Link>
                      <span className={styles.tagCount}>{count}</span>
                    </div>
                  ))}
              </div>

              <div className={styles.tagCategory}>
                <h4>General</h4>
                {tagCounts
                  .filter(({ tag }) => !tag.includes(':'))
                  .map(({ tag, count }) => (
                    <div key={tag} className={styles.tagItem}>
                      <span className={styles.tagOperator}>+</span>
                      <Link 
                        href={`/index.php?page=post&s=list&tags=${tag}`} 
                        className={styles.tagLink}
                      >
                        {tag}
                      </Link>
                      <span className={styles.tagCount}>{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.mainContent}>
          <div className={styles.postsHeader}>
            <h2>Posts</h2>
            <Link 
              href="/index.php?page=post&s=add" 
              className={styles.uploadButton}
            >
              Upload New Post
            </Link>
          </div>
          <div className={styles.postsGrid}>
            {posts.map((post) => (
              <div key={post.id} className={styles.postThumbnail} data-type={post.mediaType}>
                <Link href={`/index.php?page=post&s=view&id=${post.id}`}>
                  {post.mediaType === 'video' ? (
                    <video
                      src={post.imageUrl}
                      className={styles.thumbnailImage}
                      preload="metadata"
                      muted
                      loop
                      autoPlay
                      playsInline
                    />
                  ) : (
                    <img
                      src={post.imageUrl}
                      alt={post.tags.join(' ')}
                      className={styles.thumbnailImage}
                    />
                  )}
                </Link>
              </div>
            ))}
          </div>
          <div className={styles.pagination}>
            {Array.from({ length: pagination.total }, (_, i) => {
              const pid = i * 42
              return (
                <Link 
                  key={i + 1}
                  href={`/index.php?page=post&s=list${searchTags.length ? `&tags=${searchTags.join('+')}` : ''}&pid=${pid}`}
                  className={pagination.current === i + 1 ? styles.active : ''}
                >
                  {i + 1}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

export default PostsPage