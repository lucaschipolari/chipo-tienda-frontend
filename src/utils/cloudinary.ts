/**
 * Subida de imágenes a Cloudinary (unsigned upload preset).
 * cloud_name y preset no son secretos; se pueden sobreescribir por env.
 */
const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD || 'duwwxmywn'
const PRESET = import.meta.env.VITE_CLOUDINARY_PRESET || 'chipo-preset'

/** Inserta f_auto,q_auto para que Cloudinary entregue WebP/optimizado. */
export function optimizeCloudinaryUrl(url: string): string {
  return url.includes('/image/upload/')
    ? url.replace('/image/upload/', '/image/upload/f_auto,q_auto/')
    : url
}

/** Sube un archivo a Cloudinary y devuelve la URL optimizada (segura). */
export async function uploadToCloudinary(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  form.append('upload_preset', PRESET)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
    method: 'POST',
    body: form,
  })
  const data = await res.json().catch(() => null)
  if (!res.ok || !data?.secure_url) {
    throw new Error(data?.error?.message || 'No se pudo subir la imagen a Cloudinary')
  }
  return optimizeCloudinaryUrl(data.secure_url as string)
}
