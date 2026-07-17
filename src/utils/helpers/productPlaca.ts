import { formatMoney } from './formatMoney'

/**
 * productPlaca — genera una placa/foto del producto (PNG) lista para
 * compartir por WhatsApp: foto + nombre + precio + logo Chipo.
 *
 * Las fotos viven en Google Drive (sin CORS), así que no se pueden dibujar
 * directo en un canvas. Las pasamos por el proxy images.weserv.nl, que las
 * re-sirve con cabeceras CORS y además nos deja recortarlas cuadradas.
 */

interface PlacaProduct {
  name: string
  basePrice: number
  compareAtPrice?: number | null
  currency: string
  categoryName?: string | null
  mainImageUrl?: string | null
}

const GOLD = '#E6C15A'
const BG = '#0A0A0A'

/** Convierte una URL de imagen a una versión servida con CORS por weserv. */
function proxied(url: string, size = 1000): string {
  const noProto = url.replace(/^https?:\/\//, '')
  const src = encodeURIComponent(`ssl:${noProto}`)
  return `https://images.weserv.nl/?url=${src}&w=${size}&h=${size}&fit=cover&output=jpg`
}

function loadImage(src: string, crossOrigin = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (crossOrigin) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${src}`))
    img.src = src
  })
}

/** Dibuja un rectángulo redondeado (compat con navegadores sin roundRect). */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Parte un texto en líneas que entren en maxWidth. */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let current = ''
  for (const w of words) {
    const test = current ? `${current} ${w}` : w
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current)
      current = w
    } else {
      current = test
    }
  }
  if (current) lines.push(current)
  return lines
}

/**
 * Genera la placa y dispara la descarga como PNG.
 * @returns Promise que resuelve cuando la descarga se disparó.
 */
export async function downloadProductPlaca(product: PlacaProduct): Promise<void> {
  // Asegura que las fuentes web (Playfair/Inter) estén listas antes de medir.
  if (document.fonts?.ready) {
    try { await document.fonts.ready } catch { /* noop */ }
  }

  const W = 1080
  const H = 1350
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No se pudo crear el canvas.')

  // Fondo
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, W, H)

  // Marco decorativo sutil
  ctx.strokeStyle = 'rgba(230,193,90,0.25)'
  ctx.lineWidth = 2
  roundRect(ctx, 24, 24, W - 48, H - 48, 28)
  ctx.stroke()

  // ── Imagen del producto (cuadrada, arriba) ──
  const imgX = 90, imgY = 90, imgSize = W - 180 // 900x900
  ctx.save()
  roundRect(ctx, imgX, imgY, imgSize, imgSize, 32)
  ctx.clip()
  ctx.fillStyle = '#141414'
  ctx.fillRect(imgX, imgY, imgSize, imgSize)

  let drewImage = false
  if (product.mainImageUrl) {
    try {
      const img = await loadImage(proxied(product.mainImageUrl, 1000), true)
      // cover: escalar manteniendo relación y centrar
      const scale = Math.max(imgSize / img.width, imgSize / img.height)
      const dw = img.width * scale, dh = img.height * scale
      ctx.drawImage(img, imgX + (imgSize - dw) / 2, imgY + (imgSize - dh) / 2, dw, dh)
      drewImage = true
    } catch {
      drewImage = false
    }
  }
  ctx.restore()

  // ── Logo Chipo (mismo origen, sin CORS) ──
  let logo: HTMLImageElement | null = null
  try { logo = await loadImage('/chipo-logo.svg') } catch { logo = null }

  // Si no hubo foto, poner el logo grande de placeholder en el recuadro
  if (!drewImage && logo) {
    const lw = imgSize * 0.6
    const lh = (logo.height / logo.width) * lw
    ctx.globalAlpha = 0.5
    ctx.drawImage(logo, imgX + (imgSize - lw) / 2, imgY + (imgSize - lh) / 2, lw, lh)
    ctx.globalAlpha = 1
  }

  // ── Textos ──
  let y = imgY + imgSize + 70

  // Categoría
  if (product.categoryName) {
    ctx.fillStyle = 'rgba(255,255,255,0.45)'
    ctx.font = '600 26px Inter, sans-serif'
    ctx.textAlign = 'center'
    // letter-spacing manual
    const label = product.categoryName.toUpperCase()
    ctx.save()
    ctx.letterSpacing = '6px'
    ctx.fillText(label, W / 2, y)
    ctx.restore()
    y += 55
  }

  // Nombre (Playfair, puede ocupar 1-2 líneas)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '600 58px "Playfair Display", serif'
  ctx.textAlign = 'center'
  const nameLines = wrapLines(ctx, product.name, W - 200).slice(0, 2)
  for (const line of nameLines) {
    ctx.fillText(line, W / 2, y)
    y += 70
  }
  y += 10

  // Precio (+ tachado si hay descuento)
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.basePrice
  if (hasDiscount) {
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.font = '400 34px Inter, sans-serif'
    const oldStr = `$${formatMoney(product.compareAtPrice!)}`
    const ow = ctx.measureText(oldStr).width
    ctx.fillText(oldStr, W / 2, y)
    // línea de tachado
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(W / 2 - ow / 2, y - 11)
    ctx.lineTo(W / 2 + ow / 2, y - 11)
    ctx.stroke()
    y += 60
  }

  ctx.fillStyle = GOLD
  ctx.font = '700 76px Inter, sans-serif'
  ctx.fillText(`$${formatMoney(product.basePrice)}`, W / 2, y)

  // ── Logo abajo ──
  if (logo && drewImage) {
    const lw = 190
    const lh = (logo.height / logo.width) * lw
    ctx.drawImage(logo, (W - lw) / 2, H - 90 - lh, lw, lh)
  }

  // ── Descargar ──
  const safeName = product.name.replace(/[^\w\sáéíóúñ-]/gi, '').trim().replace(/\s+/g, '-')
  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('No se pudo generar la imagen.'))), 'image/png'),
  )
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `chipo-${safeName || 'producto'}.png`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
