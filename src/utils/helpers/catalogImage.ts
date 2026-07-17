import JSZip from 'jszip'
import { formatMoney } from './formatMoney'
import type { ProductListItem } from '@/types/catalog.types'

/**
 * catalogImage — genera imágenes de catálogo (una o varias por categoría) con
 * la identidad de la tienda (negro + dorado): header elegante + grilla 3×4 de
 * tarjetas con marca, foto, nombre, tamaño y precio. Los agotados llevan sello
 * "AGOTADO". Al pie: WhatsApp, Instagram y fecha. Todo se empaqueta en un ZIP.
 */

// ── Paleta de la marca ──
const PAGE_BG_TOP = '#111111'
const PAGE_BG_BOT = '#050505'
const CARD_BG = '#161616'
const CARD_RING = 'rgba(255,255,255,0.08)'
const GOLD = '#E6C15A'
const WHITE = '#FFFFFF'
const MUTED = 'rgba(255,255,255,0.45)'

// ── Datos de contacto de la tienda ──
const PHONE = '381 346 2606'
const INSTAGRAM = '@chipo.ar'

// Marcas de varias palabras: para separar bien "marca" del "nombre".
const KNOWN_BRANDS = [
  'Jean Paul Gaultier', 'Paco Rabanne', 'Giorgio Armani', 'Yves Saint Laurent',
  'Carolina Herrera', 'Maison Alhambra', 'Lattafa Pride', 'Armaf', 'Lattafa',
  'Rasasi', 'Rayhaan', 'Montale', 'Mancera', 'Versace', 'Dior', 'Chanel',
  'Bharara', 'Afnan', 'Al Haramain', 'Nishane', 'Xerjoff', 'Creed', 'Azzaro',
  'Philos', 'Odyssey', 'Maison', 'Armani', 'Valentino', 'Prada', 'Gucci',
]

interface CatalogCard {
  brand: string
  name: string
  size: string | null
  price: number
  imageUrl?: string | null
  soldOut: boolean
}

function splitBrand(fullName: string): { brand: string; name: string } {
  for (const b of KNOWN_BRANDS) {
    if (fullName.toLowerCase().startsWith(b.toLowerCase() + ' ')) {
      return { brand: b.toUpperCase(), name: fullName.slice(b.length).trim() }
    }
  }
  const parts = fullName.split(' ')
  if (parts.length > 1) return { brand: parts[0].toUpperCase(), name: parts.slice(1).join(' ') }
  return { brand: '', name: fullName }
}

function extractSize(name: string): string | null {
  const m = name.match(/(\d+)\s?ml/i)
  return m ? `${m[1]}ml` : null
}

function toCard(p: ProductListItem): CatalogCard {
  const { brand, name } = splitBrand(p.name)
  return {
    brand,
    name: extractSize(name) ? name.replace(/\s*\(?\d+\s?ml\)?/i, '').trim() : name,
    size: extractSize(p.name),
    price: p.basePrice,
    imageUrl: p.mainImageUrl,
    soldOut: p.totalStock <= 0,
  }
}

function proxied(url: string, size = 600): string {
  const noProto = url.replace(/^https?:\/\//, '')
  return `https://images.weserv.nl/?url=${encodeURIComponent(`ssl:${noProto}`)}&w=${size}&h=${size}&fit=cover&output=jpg`
}

function loadImage(src: string, crossOrigin = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (crossOrigin) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`img: ${src}`))
    img.src = src
  })
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text
  let t = text
  while (t.length > 1 && ctx.measureText(t + '…').width > maxWidth) t = t.slice(0, -1)
  return t + '…'
}

const COLS = 3
const ROWS = 4
const PER_PAGE = COLS * ROWS // 12

/** Dibuja una tarjeta de producto (tema oscuro) en la posición dada. */
async function drawCard(ctx: CanvasRenderingContext2D, card: CatalogCard, x: number, y: number, w: number, h: number) {
  // Tarjeta oscura con borde sutil
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 20
  ctx.shadowOffsetY = 8
  ctx.fillStyle = CARD_BG
  roundRect(ctx, x, y, w, h, 20)
  ctx.fill()
  ctx.restore()
  ctx.strokeStyle = CARD_RING
  ctx.lineWidth = 1.5
  roundRect(ctx, x, y, w, h, 20)
  ctx.stroke()

  const padX = 16
  ctx.textAlign = 'center'

  // Marca (dorada)
  ctx.fillStyle = GOLD
  ctx.font = '800 22px Inter, sans-serif'
  if (card.brand) {
    ctx.letterSpacing = '2px'
    ctx.fillText(fitText(ctx, card.brand, w - padX * 2), x + w / 2, y + 36)
    ctx.letterSpacing = '0px'
  }

  // Foto (cover dentro de un recuadro redondeado)
  const imgTop = y + 52
  const imgH = h * 0.44
  const imgW = w - padX * 2
  const imgX = x + padX
  ctx.save()
  roundRect(ctx, imgX, imgTop, imgW, imgH, 12)
  ctx.clip()
  ctx.fillStyle = '#0d0d0d'
  ctx.fillRect(imgX, imgTop, imgW, imgH)
  if (card.imageUrl) {
    try {
      const img = await loadImage(proxied(card.imageUrl, 600), true)
      const scale = Math.max(imgW / img.width, imgH / img.height)
      const dw = img.width * scale, dh = img.height * scale
      ctx.drawImage(img, imgX + (imgW - dw) / 2, imgTop + (imgH - dh) / 2, dw, dh)
    } catch { /* sin foto */ }
  }
  ctx.restore()

  // Nombre
  let ty = imgTop + imgH + 34
  ctx.fillStyle = WHITE
  ctx.font = '600 20px Inter, sans-serif'
  ctx.letterSpacing = '0.5px'
  ctx.fillText(fitText(ctx, card.name.toUpperCase(), w - padX * 2), x + w / 2, ty)
  ctx.letterSpacing = '0px'

  // Subtítulo
  ty += 24
  ctx.fillStyle = MUTED
  ctx.font = '400 14px Inter, sans-serif'
  ctx.fillText(card.size ? `Eau de Parfum · ${card.size}` : 'Eau de Parfum', x + w / 2, ty)

  // Píldora de precio / agotado (abajo de la tarjeta)
  const pillW = 150, pillH = 40
  const pillX = x + (w - pillW) / 2
  const pillY = y + h - pillH - 16
  if (card.soldOut) {
    ctx.fillStyle = 'rgba(255,255,255,0.06)'
    roundRect(ctx, pillX, pillY, pillW, pillH, 20)
    ctx.fill()
    ctx.strokeStyle = 'rgba(220,80,80,0.5)'
    ctx.lineWidth = 1.5
    roundRect(ctx, pillX, pillY, pillW, pillH, 20)
    ctx.stroke()
    ctx.fillStyle = '#e88'
    ctx.font = '700 18px Inter, sans-serif'
    ctx.fillText('AGOTADO', x + w / 2, pillY + 26)
  } else {
    ctx.fillStyle = GOLD
    roundRect(ctx, pillX, pillY, pillW, pillH, 20)
    ctx.fill()
    ctx.fillStyle = '#0A0A0A'
    ctx.font = '800 23px Inter, sans-serif'
    ctx.fillText(`$${formatMoney(card.price)}`, x + w / 2, pillY + 28)
  }
}

/** Renderiza UNA página del catálogo y devuelve el canvas. */
async function renderPage(
  categoryName: string,
  cards: CatalogCard[],
  pageIndex: number,
  totalPages: number,
  dateStr: string,
  logo: HTMLImageElement | null,
): Promise<HTMLCanvasElement> {
  if (document.fonts?.ready) { try { await document.fonts.ready } catch { /* noop */ } }

  const W = 1080, H = 1720
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Fondo con gradiente sutil
  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, PAGE_BG_TOP)
  grad.addColorStop(1, PAGE_BG_BOT)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // ── Header ──
  ctx.textAlign = 'center'
  ctx.fillStyle = WHITE
  ctx.font = '700 90px "Playfair Display", serif'
  ctx.fillText(categoryName.toUpperCase(), W / 2, 120)
  ctx.font = 'italic 600 58px "Playfair Display", serif'
  ctx.fillStyle = GOLD
  ctx.fillText('Originales', W / 2, 190)
  if (totalPages > 1) {
    ctx.fillStyle = MUTED
    ctx.font = '500 22px Inter, sans-serif'
    ctx.fillText(`${pageIndex + 1} / ${totalPages}`, W / 2, 228)
  }

  // ── Grilla 3×4 ──
  const gridTop = 270
  const footerH = 96
  const gap = 22
  const marginX = 36
  const cellW = (W - marginX * 2 - gap * (COLS - 1)) / COLS
  const cellH = (H - gridTop - footerH - gap * (ROWS - 1)) / ROWS

  for (let i = 0; i < cards.length; i++) {
    const col = i % COLS
    const row = Math.floor(i / COLS)
    const x = marginX + col * (cellW + gap)
    const y = gridTop + row * (cellH + gap)
    await drawCard(ctx, cards[i], x, y, cellW, cellH)
  }

  // ── Footer: contacto + fecha ──
  const fy = H - footerH + 30
  // línea divisoria
  ctx.strokeStyle = 'rgba(255,255,255,0.10)'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(marginX, fy - 22)
  ctx.lineTo(W - marginX, fy - 22)
  ctx.stroke()

  // logo a la izquierda
  if (logo) {
    const lh = 34, lw = (logo.width / logo.height) * lh
    ctx.drawImage(logo, marginX, fy - 4, lw, lh)
  }

  // contacto centrado
  ctx.textAlign = 'center'
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.font = '600 26px Inter, sans-serif'
  ctx.fillText(`WhatsApp ${PHONE}   ·   Instagram ${INSTAGRAM}`, W / 2, fy + 22)

  // fecha a la derecha
  ctx.textAlign = 'right'
  ctx.fillStyle = MUTED
  ctx.font = '400 20px Inter, sans-serif'
  ctx.fillText(dateStr, W - marginX, fy + 22)

  return canvas
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('blob'))), 'image/png'),
  )
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 3000)
}

/**
 * Genera el catálogo por categoría y descarga TODO en un ZIP.
 * @returns cantidad de imágenes generadas.
 */
export async function downloadCatalog(
  products: ProductListItem[],
  onProgress?: (done: number, total: number) => void,
): Promise<number> {
  // Fecha legible (dd/mm/aaaa) — se ejecuta en el navegador
  const now = new Date()
  const dateStr = now.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  // Agrupar por categoría, excluyendo insumos internos ("Empaque")
  const groups = new Map<string, ProductListItem[]>()
  for (const p of products) {
    const cat = (p.categoryName ?? 'Otros').trim()
    if (cat.toLowerCase() === 'empaque') continue
    if (!groups.has(cat)) groups.set(cat, [])
    groups.get(cat)!.push(p)
  }

  let logo: HTMLImageElement | null = null
  try { logo = await loadImage('/chipo-logo.svg') } catch { logo = null }

  let totalPages = 0
  for (const list of groups.values()) totalPages += Math.max(1, Math.ceil(list.length / PER_PAGE))

  const zip = new JSZip()
  let done = 0

  for (const [cat, list] of groups) {
    const cards = list.map(toCard)
    const pages = Math.max(1, Math.ceil(cards.length / PER_PAGE))
    for (let p = 0; p < pages; p++) {
      const slice = cards.slice(p * PER_PAGE, (p + 1) * PER_PAGE)
      const canvas = await renderPage(cat, slice, p, pages, dateStr, logo)
      const blob = await canvasToBlob(canvas)
      const safeCat = cat.replace(/[^\w\sáéíóúñ-]/gi, '').trim().replace(/\s+/g, '-')
      const suffix = pages > 1 ? `-${p + 1}` : ''
      zip.file(`catalogo-${safeCat}${suffix}.png`, blob)
      done++
      onProgress?.(done, totalPages)
    }
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  download(zipBlob, `catalogo-chipo-${stamp}.zip`)
  return totalPages
}
