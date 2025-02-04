export interface Post {
  id: string
  imageUrl: string
  publicUrl: string
  thumbnailUrl?: string
  mediaType: 'image' | 'video'
  duration: number | null
  tags: string[]
  source: string | null
  createdAt: Date
  userId: string
  user?: {
    username: string
  }
} 