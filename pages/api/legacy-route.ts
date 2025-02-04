import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'

function transformImageUrl(url: string): string {
  // Extract the path from Cloudinary URL
  const match = url.match(/res\.cloudinary\.com\/dayjligsd\/image\/upload\/(.+)/)
  if (!match) return url
  
  // Return the path in your domain format
  return `/images/${match[1]}`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { page, s, id, tags, pid } = req.query

  if (page === 'post') {
    switch (s) {
      case 'list':
        // Handle post listing
        const offset = pid ? parseInt(pid as string) : 0
        const limit = 42
        const searchTags = tags ? String(tags).split(' ') : []

        const where = searchTags.length > 0 ? {
          tags: { hasEvery: searchTags }
        } : {}

        const [posts, total] = await Promise.all([
          prisma.post.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limit,
          }),
          prisma.post.count({ where })
        ])

        // Render the posts page
        return res.redirect(302, `/posts?${searchTags.length ? `tags=${searchTags.join('+')}` : ''}&page=${Math.floor(offset / limit) + 1}`)

      case 'view':
        // Handle single post view
        if (!id) {
          return res.status(404).end()
        }
        
        const post = await prisma.post.findUnique({
          where: { id: String(id) }
        })

        if (!post) {
          return res.status(404).end()
        }

        // Render the post view page
        return res.redirect(302, `/posts/${id}`)

      default:
        return res.redirect(302, '/posts')
    }
  }

  return res.redirect(302, '/posts')
} 