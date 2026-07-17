import JSZip from 'jszip'
import { formatMoney } from './formatMoney'

/**
 * catalogImage — genera imágenes de catálogo (1080×1920, formato Instagram)
 * al estilo de las placas: header serif "CATEGORÍA / Originales", grilla 3×4 de
 * tarjetas blancas con marca, foto, nombre, concentración, tamaño y precio en
 * píldora negra. Los decants muestran sus dos tamaños (5ml/10ml) con su precio.
 * Categorías "Diseñador" → fondo oscuro; el resto → fondo claro. Solo blanco y
 * negro. Al pie: WhatsApp, Instagram y fecha. Todo se empaqueta en un ZIP.
 */

// ── Paleta (solo blanco y negro) ──
const CARD_BG = '#FFFFFF'
const INK = '#111111'
const MUTED = '#8a8a8a'
const PILL = '#0A0A0A'

// Fondo claro (Árabes/Decants) vs oscuro (Diseñador)
const LIGHT_TOP = '#F4F2EC', LIGHT_BOT = '#E9E6DF'
const DARK_TOP = '#1c1c1c', DARK_BOT = '#080808'

const DEFAULT_CONC = 'Eau de Parfum'

// ── Datos de contacto ──
const PHONE = '381 346 2606'
const INSTAGRAM = '@chipo.ar'

// Marcas de varias palabras (para separar "marca" del "nombre").
const KNOWN_BRANDS = [
  'Jean Paul Gaultier', 'Paco Rabanne', 'Giorgio Armani', 'Yves Saint Laurent',
  'Carolina Herrera', 'Maison Alhambra', 'Al Haramain', 'Lattafa Pride',
  'Armaf', 'Lattafa', 'Rasasi', 'Rayhaan', 'Montale', 'Mancera', 'Versace',
  'Dior', 'Chanel', 'Bharara', 'Afnan', 'Nishane', 'Xerjoff', 'Creed', 'Azzaro',
  'Philos', 'Odyssey', 'Armani', 'Valentino', 'Prada', 'Gucci', 'Givenchy',
  'Kenzo', 'Arabiyat',
]

// Abreviaturas de marca para que no desborden (como en tus placas).
const BRAND_ABBR: Record<string, string> = {
  'JEAN PAUL GAULTIER': 'J.P.G',
  'YVES SAINT LAURENT': 'YVES SAINT L',
  'PACO RABANNE': 'PACO RABANNE',
}

export interface CatalogVariant { label: string; price: number; ml: number }
export interface CatalogProduct {
  name: string
  categoryName?: string | null
  imageUrl?: string | null
  soldOut: boolean
  concentration?: string | null
  variants: CatalogVariant[]
}

interface Card {
  brand: string
  name: string
  imageUrl?: string | null
  soldOut: boolean
  concentration: string
  variants: CatalogVariant[]
}

function splitBrand(fullName: string): { brand: string; name: string } {
  for (const b of KNOWN_BRANDS) {
    if (fullName.toLowerCase().startsWith(b.toLowerCase() + ' ')) {
      const up = b.toUpperCase()
      return { brand: BRAND_ABBR[up] ?? up, name: fullName.slice(b.length).trim() }
    }
  }
  const parts = fullName.split(' ')
  if (parts.length > 1) return { brand: parts[0].toUpperCase(), name: parts.slice(1).join(' ') }
  return { brand: '', name: fullName }
}

function toCard(p: CatalogProduct): Card {
  const { brand, name } = splitBrand(p.name)
  // limpiar tamaño del nombre si quedó
  const cleanName = name.replace(/\s*\(?\d+\s?ml\)?/i, '').trim() || name
  return {
    brand,
    name: cleanName,
    imageUrl: p.imageUrl,
    soldOut: p.soldOut,
    concentration: p.concentration || DEFAULT_CONC,
    variants: [...p.variants].sort((a, b) => a.ml - b.ml),
  }
}

function proxied(url: string, size = 700): string {
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

/** Dibuja una píldora negra con texto blanco centrado en (cx). */
function pill(ctx: CanvasRenderingContext2D, cx: number, top: number, w: number, h: number, text: string, font: string) {
  ctx.fillStyle = PILL
  roundRect(ctx, cx - w / 2, top, w, h, h / 2)
  ctx.fill()
  ctx.fillStyle = '#fff'
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.fillText(text, cx, top + h / 2 + 8)
}

const COLS = 3
const ROWS = 4
const PER_PAGE = COLS * ROWS // 12

async function drawCard(ctx: CanvasRenderingContext2D, card: Card, x: number, y: number, w: number, h: number) {
  // Tarjeta blanca con sombra
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.18)'
  ctx.shadowBlur = 22
  ctx.shadowOffsetY = 8
  ctx.fillStyle = CARD_BG
  roundRect(ctx, x, y, w, h, 22)
  ctx.fill()
  ctx.restore()

  const cx = x + w / 2
  const padX = 18

  // Marca
  ctx.fillStyle = INK
  ctx.font = '800 26px Inter, sans-serif'
  ctx.textAlign = 'center'
  if (card.brand) {
    ctx.letterSpacing = '1px'
    ctx.fillText(fitText(ctx, card.brand, w - padX * 2), cx, y + 44)
    ctx.letterSpacing = '0px'
  }

  // Foto (contain sobre blanco)
  const imgTop = y + 58
  const imgH = h * 0.36
  const imgW = w - padX * 2
  if (card.imageUrl) {
    try {
      const img = await loadImage(proxied(card.imageUrl, 700), true)
      const scale = Math.min(imgW / img.width, imgH / img.height)
      const dw = img.width * scale, dh = img.height * scale
      ctx.drawImage(img, cx - dw / 2, imgTop + (imgH - dh) / 2, dw, dh)
    } catch { /* sin foto */ }
  }

  // Nombre
  let ty = imgTop + imgH + 40
  ctx.fillStyle = INK
  ctx.font = '600 24px Inter, sans-serif'
  ctx.letterSpacing = '1.5px'
  ctx.fillText(fitText(ctx, card.name.toUpperCase(), w - padX * 2), cx, ty)
  ctx.letterSpacing = '0px'

  // Concentración
  ty += 28
  ctx.fillStyle = MUTED
  ctx.font = 'italic 400 17px Inter, sans-serif'
  ctx.fillText(card.concentration.toLowerCase(), cx, ty)

  const isMulti = card.variants.length >= 2

  if (card.soldOut) {
    const pw = 168, ph = 44
    const top = y + h - ph - 20
    ctx.fillStyle = '#fff'
    roundRect(ctx, cx - pw / 2, top, pw, ph, ph / 2); ctx.fill()
    ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 2
    roundRect(ctx, cx - pw / 2, top, pw, ph, ph / 2); ctx.stroke()
    ctx.fillStyle = '#c0392b'; ctx.font = '800 20px Inter, sans-serif'; ctx.textAlign = 'center'
    ctx.fillText('AGOTADO', cx, top + ph / 2 + 7)
    return
  }

  if (isMulti) {
    // Decant: fila por tamaño (label izquierda + píldora precio derecha)
    const rows = card.variants.slice(0, 2)
    const rowH = 42
    const pillW = 148, pillH = 38
    const startTop = ty + 14
    for (let i = 0; i < rows.length; i++) {
      const v = rows[i]
      const rowY = startTop + i * rowH
      ctx.font = '600 20px Inter, sans-serif'
      const labelW = ctx.measureText(v.label).width
      const gap = 14
      const totalW = labelW + gap + pillW
      const sx = cx - totalW / 2
      ctx.fillStyle = INK
      ctx.textAlign = 'left'
      ctx.fillText(v.label, sx, rowY + pillH / 2 + 7)
      pill(ctx, sx + labelW + gap + pillW / 2, rowY, pillW, pillH, `$${formatMoney(v.price)}`, '800 22px Inter, sans-serif')
    }
  } else {
    // Producto simple: tamaño + una píldora
    const v = card.variants[0]
    if (v?.label) {
      ty += 26
      ctx.fillStyle = INK
      ctx.font = '500 19px Inter, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(v.label, cx, ty)
    }
    const pw = 172, ph = 46
    const top = y + h - ph - 22
    pill(ctx, cx, top, pw, ph, `$${formatMoney(v?.price ?? 0)}`, '800 26px Inter, sans-serif')
  }
}

async function renderPage(
  categoryName: string,
  cards: Card[],
  pageIndex: number,
  totalPages: number,
  dark: boolean,
  dateStr: string,
  logo: HTMLImageElement | null,
): Promise<HTMLCanvasElement> {
  if (document.fonts?.ready) { try { await document.fonts.ready } catch { /* noop */ } }

  const W = 1080, H = 1920
  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')!

  const grad = ctx.createLinearGradient(0, 0, 0, H)
  grad.addColorStop(0, dark ? DARK_TOP : LIGHT_TOP)
  grad.addColorStop(1, dark ? DARK_BOT : LIGHT_BOT)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  const headInk = dark ? '#FFFFFF' : '#111111'

  // ── Header ──
  ctx.textAlign = 'center'
  ctx.fillStyle = headInk
  ctx.font = '700 108px "Playfair Display", serif'
  ctx.fillText(categoryName.toUpperCase(), W / 2, 150)
  ctx.font = 'italic 600 74px "Playfair Display", serif'
  ctx.fillText('Originales', W / 2, 245)
  if (totalPages > 1) {
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)'
    ctx.font = '500 24px Inter, sans-serif'
    ctx.fillText(`${pageIndex + 1} / ${totalPages}`, W / 2, 290)
  }

  // ── Grilla 3×4 ──
  const gridTop = 340
  const footerH = 120
  const gap = 24
  const marginX = 40
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
  const fy = H - footerH + 44
  ctx.strokeStyle = dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(marginX, fy - 26); ctx.lineTo(W - marginX, fy - 26); ctx.stroke()

  if (logo && dark) {
    const lh = 38, lw = (logo.width / logo.height) * lh
    ctx.drawImage(logo, marginX, fy - 6, lw, lh)
  }

  ctx.textAlign = 'center'
  ctx.fillStyle = dark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.72)'
  ctx.font = '600 28px Inter, sans-serif'
  ctx.fillText(`WhatsApp ${PHONE}   ·   Instagram ${INSTAGRAM}`, W / 2, fy + 24)

  ctx.textAlign = 'right'
  ctx.fillStyle = dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)'
  ctx.font = '400 22px Inter, sans-serif'
  ctx.fillText(dateStr, W - marginX, fy + 24)

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
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 3000)
}

function isDesignerCategory(cat: string): boolean {
  const n = cat.toLowerCase()
  return n.includes('diseñ') || n.includes('disen')
}

/**
 * Genera el catálogo por categoría (1080×1920) y descarga TODO en un ZIP.
 * @returns cantidad de imágenes generadas.
 */
export async function downloadCatalog(
  products: CatalogProduct[],
  onProgress?: (done: number, total: number) => void,
): Promise<number> {
  const now = new Date()
  const dateStr = now.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  const groups = new Map<string, CatalogProduct[]>()
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
    const dark = isDesignerCategory(cat)
    const cards = list.map(toCard)
    const pages = Math.max(1, Math.ceil(cards.length / PER_PAGE))
    for (let p = 0; p < pages; p++) {
      const slice = cards.slice(p * PER_PAGE, (p + 1) * PER_PAGE)
      const canvas = await renderPage(cat, slice, p, pages, dark, dateStr, logo)
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
