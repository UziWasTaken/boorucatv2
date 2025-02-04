import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { prisma } from '../../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    
    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' })
    }

    const { email } = req.body

    // Check if email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser && existingUser.id !== session.user.id) {
      return res.status(400).json({ message: 'Email already in use' })
    }

    // Update email
    await prisma.user.update({
      where: { id: session.user.id },
      data: { email }
    })

    res.status(200).json({ message: 'Email updated successfully' })
  } catch (error) {
    console.error('Update email error:', error)
    res.status(500).json({ message: 'Failed to update email' })
  }
} 