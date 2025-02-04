import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  
  if (!session) {
    return res.status(401).json({ message: 'Not authenticated' })
  }

  const postId = req.query.id as string

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return res.status(404).json({ message: 'Post not found' })
    }

    if (post.userId !== session.user.id) {
      return res.status(403).json({ message: 'Not authorized' })
    }

    if (req.method === 'DELETE') {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = post.imageUrl.split('/')
        const publicIdWithExtension = urlParts.slice(-2).join('/')
        const publicId = publicIdWithExtension.split('.')[0]
        
        console.log('Deleting from Cloudinary:', {
          publicId,
          resourceType: post.mediaType
        })

        // Delete media from Cloudinary
        await cloudinary.uploader.destroy(publicId, {
          resource_type: post.mediaType === 'video' ? 'video' : 'image'
        })

        // If there's a thumbnail for video, delete it too
        if (post.thumbnailUrl) {
          const thumbnailUrlParts = post.thumbnailUrl.split('/')
          const thumbnailPublicId = thumbnailUrlParts.slice(-2).join('/').split('.')[0]
          
          await cloudinary.uploader.destroy(thumbnailPublicId, {
            resource_type: 'image'
          })
        }

        // Delete post from database
        await prisma.post.delete({
          where: { id: postId }
        })

        res.status(200).json({ message: 'Post deleted successfully' })
      } catch (cloudinaryError) {
        console.error('Cloudinary deletion error:', cloudinaryError)
        
        // If Cloudinary deletion fails, still delete from database
        await prisma.post.delete({
          where: { id: postId }
        })
        
        res.status(200).json({ 
          message: 'Post deleted from database, but media deletion may have failed',
          error: cloudinaryError instanceof Error ? cloudinaryError.message : 'Unknown error'
        })
      }
    } else {
      res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Delete error:', error)
    res.status(500).json({ message: 'Failed to delete post' })
  }
} 