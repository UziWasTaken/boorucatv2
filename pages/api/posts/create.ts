import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' })
    }

    const { imageUrl, thumbnailUrl, mediaType, duration, tags, source } = req.body

    console.log('Creating post with data:', {
      imageUrl,
      thumbnailUrl,
      mediaType,
      duration,
      tags,
      source
    });

    if (!imageUrl) {
      return res.status(400).json({ message: 'Media URL is required' });
    }

    const post = await prisma.post.create({
      data: {
        imageUrl,
        thumbnailUrl,
        mediaType: mediaType as 'image' | 'video',
        duration: duration ? parseFloat(duration) : null,
        tags: Array.isArray(tags) ? tags : [],
        source: source || null,
        userId: session.user.id
      }
    })

    console.log('Post created:', post);
    res.status(200).json(post)
  } catch (error) {
    console.error('Post creation error:', error)
    res.status(500).json({ 
      message: 'Failed to create post',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 