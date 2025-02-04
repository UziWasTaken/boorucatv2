import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/prisma'

const TAG_CATEGORIES = {
  copyright: (tag: string) => tag.startsWith('copyright:'),
  character: (tag: string) => tag.startsWith('character:'),
  artist: (tag: string) => tag.startsWith('artist:'),
  general: (tag: string) => !tag.includes(':')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const query = req.query.q as string

  if (!query || query.length < 2) {
    return res.status(400).json({ message: 'Query too short' })
  }

  try {
    const posts = await prisma.post.findMany({
      select: { tags: true }
    })
    
    const allTags = Array.from(new Set(posts.flatMap(post => post.tags)))
    const matchingTags = allTags.filter(tag => 
      tag.toLowerCase().includes(query.toLowerCase())
    )

    // Organize tags by category
    const categories = Object.entries(TAG_CATEGORIES).map(([name, filter]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      tags: matchingTags
        .filter(filter)
        .sort((a, b) => {
          const aStartsWith = a.toLowerCase().startsWith(query.toLowerCase())
          const bStartsWith = b.toLowerCase().startsWith(query.toLowerCase())
          if (aStartsWith && !bStartsWith) return -1
          if (!aStartsWith && bStartsWith) return 1
          return a.localeCompare(b)
        })
        .slice(0, 5)
        .map(tag => tag.replace(/^[^:]+:/, '')) // Remove category prefix
    })).filter(category => category.tags.length > 0)

    res.status(200).json({ categories })
  } catch (error) {
    console.error('Error searching tags:', error)
    res.status(500).json({ message: 'Error searching tags' })
  }
} 