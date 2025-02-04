import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'
import { v2 as cloudinary } from 'cloudinary'
import { UploadApiOptions, UploadApiResponse } from 'cloudinary'
import formidable from 'formidable'
import { createReadStream } from 'fs'

// Add Cloudinary response type
interface CloudinaryResponse extends UploadApiResponse {
  secure_url: string
  public_id: string
  eager?: Array<{ secure_url: string }>
}

// Disable the default body parser
export const config = {
  api: {
    bodyParser: false
  }
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// Helper function to get first value from formidable field
const getFieldValue = (field: string[] | undefined): string => {
  if (!field || !field.length) return ''
  return field[0]
}

// Helper function to parse form data
const parseForm = async (req: NextApiRequest) => {
  return new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
    const form = formidable({
      maxFileSize: 100 * 1024 * 1024, // 100MB max file size
      multiples: false // Only accept single files
    })
    form.parse(req, (err, fields, files) => {
      if (err) reject(err)
      else resolve({ fields, files })
    })
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' })
    }

    const contentType = req.headers['content-type'] || ''
    let mediaFile: any
    let mediaType: string
    let duration: string
    let tags: string
    let source: string

    if (contentType.includes('multipart/form-data')) {
      const { fields, files } = await parseForm(req)
      mediaFile = files.media?.[0] || files.media // Handle both array and single file
      mediaType = getFieldValue(fields.mediaType)
      duration = getFieldValue(fields.duration)
      tags = getFieldValue(fields.tags)
      source = getFieldValue(fields.source)

      if (!mediaFile) {
        return res.status(400).json({ message: 'No media file provided in form data' })
      }
    } else {
      const body = JSON.parse(await getRawBody(req))
      mediaFile = body.media
      mediaType = body.mediaType
      duration = body.duration
      tags = body.tags
      source = body.source
    }

    if (!mediaFile) {
      return res.status(400).json({ message: 'No media provided' })
    }

    if (!mediaType) {
      return res.status(400).json({ message: 'Media type is required' })
    }

    console.log('Starting upload process...', { mediaType })

    // Ensure tags is an array
    const tagArray = Array.isArray(tags) ? tags : tags.split(' ').filter(Boolean)

    let uploadResponse: CloudinaryResponse;
    try {
      if (mediaType === 'video') {
        // Handle video upload with streaming
        uploadResponse = await new Promise((resolve, reject) => {
          const uploadOptions: UploadApiOptions = {
            resource_type: 'video' as const,
            folder: 'posts/videos',
            eager: [
              { width: 300, height: 300, crop: "fill", format: "jpg" }
            ],
            eager_async: false
          }

          console.log('Starting video upload with options:', uploadOptions)

          const stream = createReadStream(mediaFile.filepath)
          const cloudinaryStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
              if (error) {
                console.error('Cloudinary video upload error:', error)
                reject(error)
              } else {
                console.log('Video upload successful:', {
                  public_id: result?.public_id,
                  hasEager: !!result?.eager
                })
                resolve(result as CloudinaryResponse)
              }
            }
          )

          stream.pipe(cloudinaryStream)
        })
      } else {
        // Handle image upload
        uploadResponse = await new Promise((resolve, reject) => {
          const uploadOptions: UploadApiOptions = {
            resource_type: 'image' as const,
            folder: 'posts/images'
          }

          console.log('Starting image upload with options:', uploadOptions)

          cloudinary.uploader.upload(mediaFile, uploadOptions, (error, result) => {
            if (error) {
              console.error('Cloudinary image upload error:', error)
              reject(error)
            } else {
              console.log('Image upload successful:', {
                public_id: result?.public_id
              })
              resolve(result as CloudinaryResponse)
            }
          })
        })
      }
    } catch (uploadError) {
      console.error('Upload to Cloudinary failed:', uploadError)
      return res.status(500).json({
        message: 'Failed to upload to media server',
        error: uploadError instanceof Error ? uploadError.message : 'Unknown error'
      })
    }

    if (!uploadResponse || !uploadResponse.secure_url) {
      console.error('Invalid upload response:', uploadResponse)
      return res.status(500).json({ 
        message: 'Invalid response from media server',
        debug: JSON.stringify(uploadResponse)
      })
    }

    console.log('Creating database entry...')

    try {
      // Create post in database
      const post = await prisma.post.create({
        data: {
          imageUrl: uploadResponse.secure_url,
          thumbnailUrl: mediaType === 'video' ? 
            uploadResponse.eager?.[0]?.secure_url || uploadResponse.secure_url : 
            null,
          mediaType: mediaType as 'image' | 'video',
          duration: duration ? parseFloat(duration) : null,
          tags: tagArray,
          source: source || null,
          userId: session.user.id
        }
      })

      console.log('Post created successfully:', { postId: post.id })
      return res.status(200).json(post)
    } catch (dbError) {
      console.error('Database error:', dbError)
      // If database save fails, we should try to delete the uploaded media
      if (uploadResponse.public_id) {
        try {
          await cloudinary.uploader.destroy(uploadResponse.public_id, {
            resource_type: mediaType === 'video' ? 'video' : 'image'
          })
        } catch (deleteError) {
          console.error('Failed to delete media after db error:', deleteError)
        }
      }
      throw dbError
    }
  } catch (error) {
    console.error('General upload error:', error)
    return res.status(500).json({
      message: 'Failed to process upload',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

// Helper function to get raw body as string
const getRawBody = (req: NextApiRequest): Promise<string> => {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => {
      data += chunk
    })
    req.on('end', () => {
      resolve(data)
    })
    req.on('error', reject)
  })
} 