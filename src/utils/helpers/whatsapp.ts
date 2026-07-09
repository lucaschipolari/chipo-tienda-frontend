import { formatMoney } from './formatMoney'
import type { CartItem, CartTotals } from '@/store/cartStore'

/** Número de WhatsApp de Chipo (formato internacional sin +). */
export const CHIPO_WHATSAPP = '543813462606'

const PAYMENT_LABELS: Record<string, string> = {
  Transfer: 'Transferencia',
  QR: 'QR / Billetera',
  Card: 'Tarjeta',
  Cash: 'Efectivo',
}

const DELIVERY_LABELS: Record<string, string> = {
  Delivery: 'Envío a domicilio',
  Pickup: 'Retiro en persona',
}

export interface WhatsappOrderData {
  orderNumber?: string
  items: CartItem[]
  totals: CartTotals
  name: string
  phone?: string
  payment: string
  delivery: string
  address?: string
  notes?: string
}

/** Arma el texto del pedido y devuelve la URL de WhatsApp lista para abrir. */
export function buildWhatsappOrderUrl(d: WhatsappOrderData): string {
  const lines: string[] = []
  lines.push('¡Hola Chipo! Quiero hacer este pedido:')
  lines.push('')

  for (const item of d.items) {
    lines.push(`• ${item.productName} x${item.quantity} — $${formatMoney(item.unitPrice * item.quantity)}`)
  }

  lines.push('')
  if (d.totals.discountAmount > 0) {
    lines.push(`Subtotal: $${formatMoney(d.totals.subtotal)}`)
    lines.push(`Descuento: -$${formatMoney(d.totals.discountAmount)}`)
  }
  lines.push(`*Total: $${formatMoney(d.totals.total)}*`)
  lines.push('')

  lines.push(`Nombre: ${d.name}`)
  if (d.phone) lines.push(`Teléfono: ${d.phone}`)
  lines.push(`Entrega: ${DELIVERY_LABELS[d.delivery] ?? d.delivery}`)
  if (d.address) lines.push(`Dirección: ${d.address}`)
  lines.push(`Pago: ${PAYMENT_LABELS[d.payment] ?? d.payment}`)
  if (d.notes) lines.push(`Notas: ${d.notes}`)
  if (d.orderNumber) {
    lines.push('')
    lines.push(`N° de pedido: ${d.orderNumber}`)
  }

  return `https://wa.me/${CHIPO_WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`
}
