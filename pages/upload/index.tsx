import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useState, useRef } from 'react'
import styles from './Upload.module.css'

interface TagCategory {
  name: string
  tags: string[]
}

// Add interface for the signature response
interface SignatureResponse {
  timestamp: number;
  eager: string;
  eager_async: boolean;
  folder: string;
  resource_type: string;
  chunk_size: number;
  transformation: string;
  signature: string;
  api_key: string;
}

const UploadPage: NextPage = () => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [thumbnail, setThumbnail] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image')
  const [duration, setDuration] = useState<number>(0)
  const [tagInput, setTagInput] = useState('')
  const [tagSuggestions, setTagSuggestions] = useState<TagCategory[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/account')
    return null
  }

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
      setMediaType(selectedFile.type.startsWith('video/') ? 'video' : 'image')
      
      // Get video duration if it's a video
      if (selectedFile.type.startsWith('video/')) {
        const video = document.createElement('video')
        video.src = URL.createObjectURL(selectedFile)
        video.onloadedmetadata = () => {
          setDuration(video.duration)
        }
      }
    } else {
      setFile(null)
      setPreview(null)
      setMediaType('image')
      setDuration(0)
    }
  }

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setThumbnail(selectedFile)
      setThumbnailPreview(URL.createObjectURL(selectedFile))
    }
  }

  const handleTagInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setTagInput(value)
    
    const lastTag = value.split(' ').pop() || ''
    
    // Only fetch suggestions if we have a partial tag to search for
    if (lastTag.length >= 2) {
      try {
        const res = await fetch(`/api/tags/search?q=${encodeURIComponent(lastTag)}`)
        const data = await res.json()
        setTagSuggestions(data.categories || [])
        setShowSuggestions(true)
      } catch (error) {
        console.error('Error fetching tag suggestions:', error)
        setTagSuggestions([])
        setShowSuggestions(false)
      }
    } else {
      setTagSuggestions([])
      setShowSuggestions(false)
    }
  }

  const addTag = (tag: string) => {
    const tags = tagInput.trim().split(/\s+/).filter(Boolean)
    tags.pop() // Remove the partial tag
    const newTags = [...tags, tag]
    setTagInput(newTags.join(' ') + ' ')
    setShowSuggestions(false)
  }

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setUploading(true)
    setError('')

    // Get the form from the event
    const form = e.currentTarget

    try {
      // Upload main file
      const mainFormData = new FormData()
      if (!file) throw new Error('No file selected')
      mainFormData.append('file', file)
      mainFormData.append('upload_preset', 'ml_default')
      mainFormData.append('folder', 'posts')

      if (mediaType === 'video') {
        mainFormData.append('resource_type', 'video')
        mainFormData.append('tags', 'video')
      }

      const mainUploadResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/${mediaType === 'video' ? 'video' : 'auto'}/upload`,
        {
          method: 'POST',
          body: mainFormData,
        }
      )

      if (!mainUploadResponse.ok) throw new Error('Failed to upload main file')
      const mainUploadData = await mainUploadResponse.json()

      // Upload thumbnail if provided
      let thumbnailUrl = null
      if (thumbnail) {
        const thumbnailFormData = new FormData()
        thumbnailFormData.append('file', thumbnail)
        thumbnailFormData.append('upload_preset', 'ml_default')
        thumbnailFormData.append('folder', 'thumbnails')

        const thumbnailUploadResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          {
            method: 'POST',
            body: thumbnailFormData,
          }
        )

        if (!thumbnailUploadResponse.ok) throw new Error('Failed to upload thumbnail')
        const thumbnailUploadData = await thumbnailUploadResponse.json()
        thumbnailUrl = thumbnailUploadData.secure_url
      }

      // Create post with custom domain URLs
      const cloudinaryPath = mainUploadData.secure_url.split('/upload/')[1]
      const thumbnailPath = thumbnailUrl ? thumbnailUrl.split('/upload/')[1] : null

      const postData = {
        imageUrl: mainUploadData.secure_url,
        publicUrl: `${process.env.NEXT_PUBLIC_DOMAIN}samples/${cloudinaryPath}`,
        thumbnailUrl: thumbnailPath ? `${process.env.NEXT_PUBLIC_DOMAIN}samples/${thumbnailPath}` : null,
        mediaType,
        duration: mediaType === 'video' ? mainUploadData.duration : null,
        tags: tagInput.trim().split(/\s+/).filter(Boolean),
        source: form.querySelector<HTMLInputElement>('input[name="source"]')?.value || null,
      }

      // Create post
      const postRes = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      })

      if (!postRes.ok) throw new Error('Failed to create post')

      router.push('/posts')
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Upload - Kazuru</title>
      </Head>
      <div id="content">
        <div className={styles.uploadContainer}>
          <h2>Upload Media</h2>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleUpload} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="file">File (Images & Videos):</label>
              <input 
                type="file" 
                id="file" 
                name="file" 
                accept="image/*,video/*"
                onChange={handleFileChange}
                required 
              />
            </div>

            {mediaType === 'video' && (
              <div className={styles.formGroup}>
                <label htmlFor="thumbnail">Thumbnail (Required for videos):</label>
                <input
                  type="file"
                  id="thumbnail"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  required
                />
              </div>
            )}

            {preview && (
              <div className={styles.previewContainer}>
                {mediaType === 'image' ? (
                  <Image
                    src={preview}
                    alt="Upload preview"
                    width={300}
                    height={300}
                    className={styles.preview}
                    onLoad={() => URL.revokeObjectURL(preview)}
                  />
                ) : (
                  <video
                    ref={videoRef}
                    src={preview}
                    controls
                    className={styles.preview}
                    onLoadedData={() => URL.revokeObjectURL(preview)}
                  />
                )}
              </div>
            )}

            {thumbnailPreview && (
              <div className={styles.previewContainer}>
                <h3>Thumbnail Preview:</h3>
                <img src={thumbnailPreview} alt="Thumbnail Preview" className={styles.preview} />
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="tags">Tags (space separated):</label>
              <div className={styles.tagInputContainer}>
                <input 
                  type="text" 
                  id="tags" 
                  name="tags" 
                  value={tagInput}
                  onChange={handleTagInput}
                  placeholder="tag1 tag2 tag3"
                  required 
                />
                {showSuggestions && tagSuggestions.length > 0 && (
                  <div className={styles.tagSuggestions}>
                    {tagSuggestions.map((category) => (
                      <div key={category.name} className={styles.tagCategory}>
                        <h4>{category.name}</h4>
                        <div className={styles.tagList}>
                          {category.tags.map((tag) => (
                            <div
                              key={tag}
                              className={styles.tagSuggestion}
                              onClick={() => addTag(tag)}
                            >
                              {tag}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="source">Source (optional):</label>
              <input 
                type="url" 
                id="source" 
                name="source" 
                placeholder="https://"
              />
            </div>

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Post'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

export default UploadPage 