import { formatMoney } from './formatMoney'
import type { ProductListItem } from '@/types/catalog.types'

/**
 * catalogImage — genera imágenes de catálogo (una o varias por categoría),
 * al estilo de las placas de Canva: header elegante + grilla 3×3 de tarjetas
 * con marca, foto, nombre, tamaño y precio. Los agotados llevan un sello
 * "SIN STOCK". Pensado para mandar por WhatsApp sin editar nada a mano.
 */

const GOLD = '#B8892B'
const CARD_BG = '#FFFFFF'
const PAGE_BG = '#F3F1EC'

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

/** Separa "Armaf Club De Nuit Iconic" → { brand: "ARMAF", name: "Club De Nuit Iconic" }. */
function splitBrand(fullName: string): { brand: string; name: string } {
  for (const b of KNOWN_BRANDS) {
    if (fullName.toLowerCase().startsWith(b.toLowerCase() + ' ')) {
      return { brand: b.toUpperCase(), name: fullName.slice(b.length).trim() }
    }
  }
  // Fallback: primera palabra como marca
  const parts = fullName.split(' ')
  if (parts.length > 1) return { brand: parts[0].toUpperCase(), name: parts.slice(1).join(' ') }
  return { brand: '', name: fullName }
}

/** Extrae el tamaño (ej "100ml") si está en el nombre. */
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
  return `https://images.weserv.nl/?url=${encodeURIComponent(`ssl:${noProto}`)}&w=${size}&h=${size}&fit=contain&cbg=white&output=jpg`
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
const ROWS = 3
const PER_PAGE = COLS * ROWS

/** Dibuja una tarjeta de producto en la posición dada. */
async function drawCard(ctx: CanvasRenderingContext2D, card: CatalogCard, x: number, y: number, w: number, h: number) {
  // Fondo blanco de la tarjeta
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.10)'
  ctx.shadowBlur = 18
  ctx.shadowOffsetY = 6
  ctx.fillStyle = CARD_BG
  roundRect(ctx, x, y, w, h, 18)
  ctx.fill()
  ctx.restore()

  const padX = 18
  // Marca
  ctx.fillStyle = '#111'
  ctx.font = '800 24px Inter, sans-serif'
  ctx.textAlign = 'center'
  if (card.brand) ctx.fillText(fitText(ctx, card.brand, w - padX * 2), x + w / 2, y + 40)

  // Foto
  const imgAreaY = y + 58
  const imgSize = Math.min(w - padX * 2, h * 0.42)
  const imgX = x + (w - imgSize) / 2
  if (card.imageUrl) {
    try {
      const img = await loadImage(proxied(card.imageUrl, 600), true)
      const scale = Math.min(imgSize / img.width, imgSize / img.height)
      const dw = img.width * scale, dh = img.height * scale
      ctx.drawImage(img, imgX + (imgSize - dw) / 2, imgAreaY + (imgSize - dh) / 2, dw, dh)
    } catch { /* sin foto: se deja el espacio en blanco */ }
  }

  // Nombre del producto
  let ty = imgAreaY + imgSize + 34
  ctx.fillStyle = '#1a1a1a'
  ctx.font = '600 21px Inter, sans-serif'
  // letter-spacing sutil como el Canva
  ctx.letterSpacing = '1px'
  ctx.fillText(fitText(ctx, card.name.toUpperCase(), w - padX * 2), x + w / 2, ty)
  ctx.letterSpacing = '0px'

  // "eau de parfum" + tamaño
  ty += 26
  ctx.fillStyle = '#8a8a8a'
  ctx.font = '400 15px Inter, sans-serif'
  const sub = card.size ? `eau de parfum · ${card.size}` : 'eau de parfum'
  ctx.fillText(sub, x + w / 2, ty)

  // Píldora de precio (negra) o sello SIN STOCK (rojo)
  ty += 22
  const pillW = 150, pillH = 42
  const pillX = x + (w - pillW) / 2
  if (card.soldOut) {
    ctx.fillStyle = '#9b1c1c'
    roundRect(ctx, pillX, ty, pillW, pillH, 21)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = '700 20px Inter, sans-serif'
    ctx.fillText('SIN STOCK', x + w / 2, ty + 28)
  } else {
    ctx.fillStyle = '#0A0A0A'
    roundRect(ctx, pillX, ty, pillW, pillH, 21)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = '700 24px Inter, sans-serif'
    ctx.fillText(`$${formatMoney(card.price)}`, x + w / 2, ty + 29)
  }
}

/** Renderiza UNA página del catálogo y devuelve el canvas. */
async function renderPage(
  categoryName: string,
  cards: CatalogCard[],
  pageIndex: number,
  totalPages: number,
  logo: HTMLImageElement | null,
): Promise<HTMLCanvasElement> {
  if (document.fonts?.ready) { try { await document.fonts.ready } catch { /* noop */ } }

  const W = 1080, H = 1500
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = PAGE_BG
  ctx.fillRect(0, 0, W, H)

  // ── Header ──
  ctx.textAlign = 'center'
  ctx.fillStyle = '#111'
  ctx.font = '700 96px "Playfair Display", serif'
  ctx.fillText(categoryName.toUpperCase(), W / 2, 130)
  ctx.font = 'italic 600 64px "Playfair Display", serif'
  ctx.fillStyle = GOLD
  ctx.fillText('Originales', W / 2, 210)
  if (totalPages > 1) {
    ctx.fillStyle = '#999'
    ctx.font = '500 24px Inter, sans-serif'
    ctx.fillText(`${pageIndex + 1} / ${totalPages}`, W / 2, 250)
  }

  // ── Grilla ──
  const gridTop = 290
  const gap = 26
  const marginX = 40
  const cellW = (W - marginX * 2 - gap * (COLS - 1)) / COLS
  const cellH = (H - gridTop - 40 - gap * (ROWS - 1)) / ROWS

  for (let i = 0; i < cards.length; i++) {
    const col = i % COLS
    const row = Math.floor(i / COLS)
    const x = marginX + col * (cellW + gap)
    const y = gridTop + row * (cellH + gap)
    await drawCard(ctx, cards[i], x, y, cellW, cellH)
  }

  // ── Logo abajo (marca de agua sutil) ──
  if (logo) {
    const lw = 150
    const lh = (logo.height / logo.width) * lw
    ctx.globalAlpha = 0.85
    ctx.drawImage(logo, (W - lw) / 2, H - lh - 8, lw, lh)
    ctx.globalAlpha = 1
  }

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
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/**
 * Genera y descarga el catálogo agrupado por categoría.
 * @param products  todos los productos publicados a incluir.
 * @param onProgress callback opcional (hechas, total) para mostrar avance.
 */
export async function downloadCatalog(
  products: ProductListItem[],
  onProgress?: (done: number, total: number) => void,
): Promise<number> {
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

  // Total de páginas para el progreso
  let totalPages = 0
  for (const list of groups.values()) totalPages += Math.max(1, Math.ceil(list.length / PER_PAGE))
  let done = 0

  for (const [cat, list] of groups) {
    const cards = list.map(toCard)
    const pages = Math.max(1, Math.ceil(cards.length / PER_PAGE))
    for (let p = 0; p < pages; p++) {
      const slice = cards.slice(p * PER_PAGE, (p + 1) * PER_PAGE)
      const canvas = await renderPage(cat, slice, p, pages, logo)
      const blob = await canvasToBlob(canvas)
      const safeCat = cat.replace(/[^\w\sáéíóúñ-]/gi, '').trim().replace(/\s+/g, '-')
      const suffix = pages > 1 ? `-${p + 1}` : ''
      download(blob, `catalogo-${safeCat}${suffix}.png`)
      done++
      onProgress?.(done, totalPages)
      // pequeña pausa para que el navegador no bloquee descargas múltiples
      await new Promise(r => setTimeout(r, 400))
    }
  }
  return totalPages
}
