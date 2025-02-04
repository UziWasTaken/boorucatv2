export function transformCloudinaryUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const match = url.match(/res\.cloudinary\.com\/dayjligsd\/image\/upload\/(.+)/)
  if (!match) return url
  return `https://r34cat.online/images/${match[1]}`
} 