import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft, Package, ShoppingBag, MessageCircle,
  CreditCard, Banknote, QrCode, Landmark, Loader2, CheckCircle2,
} from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { ordersService } from '@/features/orders/ordersService'
import { formatMoney } from '@/utils/helpers/formatMoney'
import { buildWhatsappOrderUrl } from '@/utils/helpers/whatsapp'
import { cn } from '@/utils/helpers/cn'
import { Reveal } from '@/components/store/Reveal'
import type { PaymentMethod, DeliveryMethod } from '@/types/order.types'

/**
 * CheckoutPage — un solo paso (estilo Pency).
 * Datos + entrega + pago en un formulario corto. Al confirmar: crea el pedido
 * en el backend y abre WhatsApp con el detalle.
 */

const PAYMENT_OPTIONS: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { value: 'Transfer', label: 'Transferencia', icon: <Landmark className="h-4 w-4" /> },
  { value: 'QR',       label: 'QR / Billetera', icon: <QrCode className="h-4 w-4" /> },
  { value: 'Card',     label: 'Tarjeta',        icon: <CreditCard className="h-4 w-4" /> },
  { value: 'Cash',     label: 'Efectivo',       icon: <Banknote className="h-4 w-4" /> },
]

interface FormState {
  name: string
  phone: string
  email: string
  delivery: DeliveryMethod
  street: string
  city: string
  payment: PaymentMethod
  notes: string
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const items = useCartStore(s => s.items)
  const totals = useCartStore(s => s.totals)
  const clearCart = useCartStore(s => s.clearCart)
  const couponCode = useCartStore(s => s.couponCode)
  const user = useAuthStore(s => s.user)

  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState<{ waUrl: string } | null>(null)
  const [form, setForm] = useState<FormState>({
    name: user?.fullName ?? '',
    phone: '',
    email: user?.email ?? '',
    delivery: 'Delivery',
    street: '',
    city: '',
    payment: 'Transfer',
    notes: '',
  })

  const set = (k: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm(f => ({ ...f, [k]: e.target.value }))

  // Validación mínima: nombre + teléfono, y dirección si es envío
  const valid =
    form.name.trim().length > 1 &&
    form.phone.trim().length >= 6 &&
    (form.delivery === 'Pickup' || (form.street.trim() && form.city.trim()))

  async function handleConfirm() {
    if (!valid) {
      toast.error('Completá tu nombre, teléfono y dirección de entrega.')
      return
    }
    setSubmitting(true)

    const address = form.delivery === 'Pickup'
      ? 'Retiro en persona'
      : [form.street.trim(), form.city.trim()].filter(Boolean).join(', ')

    const waUrl = buildWhatsappOrderUrl({
      items,
      totals,
      name: form.name.trim(),
      phone: form.phone.trim(),
      payment: form.payment,
      delivery: form.delivery,
      address: form.delivery === 'Delivery' ? address : undefined,
      notes: form.notes.trim() || undefined,
    })

    // Con sesión iniciada, el pedido se asocia SIEMPRE al email de la cuenta
    // (así aparece de forma confiable en "Mis pedidos"). Invitado: email opcional.
    const buyerEmail = user?.email
      ?? (form.email.trim() || `${form.phone.trim().replace(/\D/g, '')}@wa.chipo`)

    try {
      await ordersService.create({
        buyerName: form.name.trim(),
        buyerEmail,
        buyerPhone: form.phone.trim() || undefined,
        items: items.map(i => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
        shippingAddress: {
          street: form.delivery === 'Pickup' ? 'Retiro en tienda' : form.street.trim(),
          city: form.city.trim() || '—',
          country: 'AR',
        },
        shippingCost: 0,
        currency: totals.currency || 'ARS',
        paymentMethod: form.payment,
        deliveryMethod: form.delivery,
        couponCode: couponCode ?? undefined,
        notes: form.notes.trim() || undefined,
      })
      clearCart()
      // Abrir WhatsApp inmediatamente (mismo gesto del usuario → no lo bloquea el navegador)
      window.open(waUrl, '_blank')
      setDone({ waUrl })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { errors?: { message?: string } } } }
      toast.error(e?.response?.data?.errors?.message ?? 'No pudimos crear tu pedido. Intentá de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Pedido confirmado ──
  if (done) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
        <Reveal>
          <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30">
            <CheckCircle2 className="h-9 w-9 text-emerald-400" />
          </div>
          <h1 className="font-display text-3xl font-medium text-white">¡Tu pedido está en camino!</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-neutral-400">
            Recibimos tu pedido y abrimos WhatsApp para que lo confirmes con nosotros.
            Si no se abrió, tocá el botón de acá abajo.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={done.waUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-7 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-400"
            >
              <MessageCircle className="h-4 w-4" />
              Abrir WhatsApp
            </a>
            <Link
              to={user ? '/account/orders' : '/'}
              className="rounded-full px-7 py-3 text-sm text-neutral-300 ring-1 ring-white/15 transition-all hover:text-white hover:ring-white/35"
            >
              {user ? 'Ver mis pedidos' : 'Seguir explorando'}
            </Link>
          </div>
        </Reveal>
      </div>
    )
  }

  // ── Carrito vacío ──
  if (items.length === 0) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <Package className="mb-4 h-12 w-12 text-neutral-700" />
        <h1 className="text-lg font-medium text-white">Tu carrito está vacío</h1>
        <p className="mt-1 text-sm text-neutral-500">Encontrá una fragancia que cuente tu historia.</p>
        <Link
          to="/"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-semibold text-black transition-all hover:bg-neutral-200"
        >
          <ShoppingBag className="h-4 w-4" />
          Ver productos
        </Link>
      </div>
    )
  }

  const inputCls =
    'w-full rounded-xl bg-white/[0.04] px-4 py-3 text-sm text-white ring-1 ring-white/10 placeholder:text-neutral-600 transition-all focus:outline-none focus:ring-white/30'

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-sm text-neutral-500 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Seguir comprando
      </button>

      <h1 className="mb-8 font-display text-2xl font-medium text-white sm:text-3xl">
        Finalizá tu pedido
      </h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* ── Formulario único ── */}
        <div className="space-y-7">
          {/* Datos */}
          <section className="space-y-4">
            <h2 className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Tus datos</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs text-neutral-500">Nombre y apellido *</label>
                <input value={form.name} onChange={set('name')} placeholder="María González" className={inputCls} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-neutral-500">WhatsApp / Teléfono *</label>
                <input value={form.phone} onChange={set('phone')} placeholder="381 000 0000" className={inputCls} />
              </div>
            </div>
            {user ? (
              <div className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-4 py-3 text-xs text-neutral-400 ring-1 ring-white/10">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                Tu pedido se va a guardar en tu cuenta ({user.email}) y lo vas a ver en “Mis pedidos”.
              </div>
            ) : (
              <div>
                <label className="mb-1.5 block text-xs text-neutral-500">Email (opcional)</label>
                <input type="email" value={form.email} onChange={set('email')} placeholder="maria@email.com" className={inputCls} />
                <p className="mt-1.5 text-[11px] text-neutral-600">
                  ¿Ya tenés cuenta? <Link to="/login?redirect=/checkout" className="underline hover:text-white">Iniciá sesión</Link> para guardar tu pedido.
                </p>
              </div>
            )}
          </section>

          {/* Entrega */}
          <section className="space-y-4">
            <h2 className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">Entrega</h2>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 'Delivery', label: 'Envío a domicilio', desc: 'Coordinamos el envío' },
                { value: 'Pickup',   label: 'Retiro en persona', desc: 'Coordinamos el punto' },
              ] as const).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setForm(f => ({ ...f, delivery: opt.value }))}
                  className={cn(
                    'rounded-2xl p-4 text-left ring-1 transition-all duration-300',
                    form.delivery === opt.value ? 'bg-white/[0.07] ring-white/40' : 'ring-white/10 hover:ring-white/25',
                  )}
                >
                  <p className="text-sm font-medium text-white">{opt.label}</p>
                  <p className="mt-1 text-xs text-neutral-500">{opt.desc}</p>
                </button>
              ))}
            </div>
            {form.delivery === 'Delivery' && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs text-neutral-500">Calle y número *</label>
                  <input value={form.street} onChange={set('street')} placeholder="Av. Corrientes 1234" className={inputCls} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-neutral-500">Ciudad *</label>
                  <input value={form.city} onChange={set('city')} placeholder="Tucumán" className={inputCls} />
                </div>
              </div>
            )}
          </section>

          {/* Pago */}
          <section className="space-y-4">
            <h2 className="text-[11px] uppercase tracking-[0.25em] text-neutral-500">¿Cómo pagás?</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {PAYMENT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setForm(f => ({ ...f, payment: opt.value }))}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-2xl p-4 text-center ring-1 transition-all duration-300',
                    form.payment === opt.value ? 'bg-white/[0.07] ring-white/40' : 'ring-white/10 hover:ring-white/25',
                  )}
                >
                  <span className="text-neutral-300">{opt.icon}</span>
                  <span className="text-xs font-medium text-white">{opt.label}</span>
                </button>
              ))}
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-neutral-500">Notas (opcional)</label>
              <textarea value={form.notes} onChange={set('notes')} rows={2} placeholder="Aclaraciones, horarios…" className={cn(inputCls, 'resize-none')} />
            </div>
          </section>
        </div>

        {/* ── Resumen ── */}
        <aside className="h-fit rounded-3xl bg-[#141414] p-6 ring-1 ring-white/10 lg:sticky lg:top-24">
          <h3 className="mb-5 text-[11px] uppercase tracking-[0.25em] text-neutral-500">Tu pedido</h3>
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.variantId} className="flex items-center gap-3">
                <div className="h-14 w-12 shrink-0 overflow-hidden rounded-xl bg-white/[0.04] ring-1 ring-white/5">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.productName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-4 w-4 text-neutral-700" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{item.productName}</p>
                  <p className="text-xs text-neutral-500">×{item.quantity}</p>
                </div>
                <span className="text-sm tabular-nums text-neutral-300">
                  ${formatMoney(item.unitPrice * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-6 space-y-2 border-t border-white/5 pt-5 text-sm">
            {totals.discountAmount > 0 && (
              <>
                <div className="flex justify-between text-neutral-400">
                  <span>Subtotal</span>
                  <span className="tabular-nums">${formatMoney(totals.subtotal)}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Descuento</span>
                  <span className="tabular-nums">−${formatMoney(totals.discountAmount)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between text-neutral-400">
              <span>Envío</span>
              <span className="text-xs text-neutral-500">A coordinar</span>
            </div>
            <div className="flex items-baseline justify-between border-t border-white/5 pt-3">
              <span className="font-medium text-white">Total</span>
              <span className="text-xl font-semibold tabular-nums text-white">${formatMoney(totals.total)}</span>
            </div>
          </div>

          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-emerald-400 disabled:opacity-60"
          >
            {submitting
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Creando pedido…</>
              : <><MessageCircle className="h-4 w-4" /> Confirmar por WhatsApp</>}
          </button>
          <p className="mt-3 text-center text-xs leading-relaxed text-neutral-600">
            Confirmás el pago y la entrega por WhatsApp. No se cobra nada en el sitio.
          </p>
        </aside>
      </div>
    </div>
  )
}
