import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

// Add interface for the signature parameters
interface SignatureParams {
  timestamp: number;
  eager: string;
  eager_async: boolean;
  folder: string;
  resource_type: string;
  chunk_size: number;
  transformation: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const { timestamp } = req.body

    if (!timestamp) {
      return res.status(400).json({ message: 'Timestamp is required' })
    }

    // Only include the essential parameters that need to be signed
    const paramsToSign = {
      timestamp,
      folder: 'posts'
    }

    console.log('Signing parameters:', paramsToSign)

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      process.env.CLOUDINARY_API_SECRET!
    )

    console.log('Generated signature:', signature)

    // Return response with additional parameters that don't need to be signed
    const response = {
      ...paramsToSign,
      signature,
      api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      resource_type: 'auto'
    }

    console.log('Sending response:', response)

    res.status(200).json(response)
  } catch (error) {
    console.error('Signature generation error:', error)
    res.status(500).json({ 
      message: 'Failed to generate upload signature',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 