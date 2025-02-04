import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path } = req.query
  
  if (!path || !Array.isArray(path)) {
    return res.status(400).json({ error: 'Invalid path' })
  }

  const imagePath = path.join('/')
  const imageUrl = `https://res.cloudinary.com/dayjligsd/image/upload/${imagePath}`

  try {
    const response = await fetch(imageUrl)
    if (!response.ok) throw new Error('Failed to fetch image')

    // Get the content type and other headers
    const contentType = response.headers.get('content-type')
    const contentLength = response.headers.get('content-length')
    
    // Set appropriate headers
    res.setHeader('Content-Type', contentType || 'image/jpeg')
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    if (contentLength) {
      res.setHeader('Content-Length', contentLength)
    }

    // Get the image data and send it
    const buffer = await response.arrayBuffer()
    res.send(Buffer.from(buffer))
  } catch (error) {
    console.error('Image proxy error:', error)
    res.status(500).json({ error: 'Failed to fetch image' })
  }
} 