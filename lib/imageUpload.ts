import imageCompression from 'browser-image-compression'
import { supabase } from './supabase'

export async function uploadImage(
  file: File,
  bucket: 'bento-photos' | 'side-dish-photos'
): Promise<string> {
  const compressed = await imageCompression(file, { maxSizeMB: 0.5 })
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage.from(bucket).upload(path, compressed)
  if (error) throw error

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}
