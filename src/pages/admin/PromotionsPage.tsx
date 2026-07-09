import { useState, useCallback } from 'react'
import {
  Plus, Search, X, Loader2, ToggleLeft, ToggleRight, Edit2, Copy,
  Tag, Zap, Clock, ShoppingBag, Layers, Gift, Star, CheckCircle2, XCircle,
} from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { useDebounce } from '@/hooks/useDebounce'
import {
  usePromotions,
  usePromotionsDashboard,
  useCreatePromotion,
  useUpdatePromotion,
  useTogglePromotion,
  useDuplicatePromotion,
} from '@/features/promotions/hooks/usePromotions'
import { Modal } from '@/components/ui/Modal/Modal'
import { Badge } from '@/components/ui/Badge/Badge'
import { StatCard } from '@/components/data-display/StatCard/StatCard'
import { cn } from '@/utils/helpers/cn'
import type {
  PromotionListItem,
  PromotionDetail,
  PromotionType,
  CreatePromotionRequest,
  UpdatePromotionRequest,
} from '@/types/promotions.types'
import { formatMoney } from '@/utils/helpers/formatMoney'

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<PromotionType, string> = {
  Product:    'Producto',
  Category:   'Categoría',
  BuyXGetY:   'Lleva X Paga Y',
  MinAmount:  'Monto mínimo',
  Combo:      'Combo',
  Flash:      'Flash Sale',
  HappyHour:  'Happy Hour',
}

const TYPE_BADGE_VARIANT: Record<PromotionType, string> = {
  Product:   'info',
  Category:  'secondary',
  BuyXGetY:  'success',
  MinAmount:  'warning',
  Combo:     'primary',
  Flash:     'danger',
  HappyHour: 'gold',
}

const TYPE_ICONS: Record<PromotionType, React.ElementType> = {
  Product:   ShoppingBag,
  Category:  Layers,
  BuyXGetY:  Gift,
  MinAmount:  Tag,
  Combo:     Star,
  Flash:     Zap,
  HappyHour: Clock,
}

const PROMOTION_TYPES: PromotionType[] = [
  'Product', 'Category', 'BuyXGetY', 'MinAmount', 'Combo', 'Flash', 'HappyHour',
]

// Types that require product IDs
const TYPES_WITH_PRODUCTS: PromotionType[] = ['Product', 'Combo', 'Flash', 'BuyXGetY']
// Types that require time window
const TYPES_WITH_TIME: PromotionType[] = ['Flash', 'HappyHour']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// ─── TypeBadge ───────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: PromotionType }) {
  const Icon = TYPE_ICONS[type] ?? Tag
  return (
    <Badge variant={TYPE_BADGE_VARIANT[type] as any} size="sm">
      <Icon className="h-3 w-3" />
      {TYPE_LABELS[type] ?? type}
    </Badge>
  )
}

// ─── Form types ───────────────────────────────────────────────────────────────

interface PromotionFormValues {
  name: string
  description: string
  type: PromotionType
  badge: string
  discountType: 'Percentage' | 'FixedAmount'
  discountValue: number
  currency: string
  startsAt: string
  endsAt: string
  isStackable: boolean
  priority: number
  // Conditional
  buyQuantity: number
  getQuantity: number
  activeFrom: string
  activeUntil: string
  minOrderAmount: number
  comboPrice: number
  productIds: string
  categoryIds: string
}

const defaultFormValues: PromotionFormValues = {
  name: '',
  description: '',
  type: 'Product',
  badge: '',
  discountType: 'Percentage',
  discountValue: 0,
  currency: 'ARS',
  startsAt: '',
  endsAt: '',
  isStackable: false,
  priority: 0,
  buyQuantity: 1,
  getQuantity: 1,
  activeFrom: '',
  activeUntil: '',
  minOrderAmount: 0,
  comboPrice: 0,
  productIds: '',
  categoryIds: '',
}

function promotionToFormValues(p: PromotionDetail): PromotionFormValues {
  const toDateLocal = (iso?: string) =>
    iso ? new Date(iso).toISOString().slice(0, 16) : ''
  return {
    name: p.name,
    description: p.description ?? '',
    type: p.type,
    badge: p.badge ?? '',
    discountType: p.discountType,
    discountValue: p.discountValue,
    currency: p.currency,
    startsAt: toDateLocal(p.startsAt),
    endsAt: toDateLocal(p.endsAt),
    isStackable: p.isStackable,
    priority: p.priority,
    buyQuantity: p.buyQuantity ?? 1,
    getQuantity: p.getQuantity ?? 1,
    activeFrom: p.activeFrom ?? '',
    activeUntil: p.activeUntil ?? '',
    minOrderAmount: p.minOrderAmount ?? 0,
    comboPrice: p.comboPrice ?? 0,
    productIds: (p.productIds ?? []).join(', '),
    categoryIds: (p.categoryIds ?? []).join(', '),
  }
}

function formValuesToRequest(values: PromotionFormValues): CreatePromotionRequest {
  const parseIds = (raw: string) =>
    raw.split(',').map(s => s.trim()).filter(Boolean)

  return {
    name: values.name,
    type: values.type,
    discountType: values.discountType,
    discountValue: Number(values.discountValue),
    startsAt: values.startsAt,
    endsAt: values.endsAt || undefined,
    description: values.description || undefined,
    badge: values.badge || undefined,
    currency: values.currency,
    isStackable: values.isStackable,
    priority: Number(values.priority),
    activeFrom: TYPES_WITH_TIME.includes(values.type) ? values.activeFrom || undefined : undefined,
    activeUntil: TYPES_WITH_TIME.includes(values.type) ? values.activeUntil || undefined : undefined,
    buyQuantity: values.type === 'BuyXGetY' ? Number(values.buyQuantity) : undefined,
    getQuantity: values.type === 'BuyXGetY' ? Number(values.getQuantity) : undefined,
    minOrderAmount: values.type === 'MinAmount' ? Number(values.minOrderAmount) : undefined,
    comboPrice: values.type === 'Combo' ? Number(values.comboPrice) || undefined : undefined,
    productIds: TYPES_WITH_PRODUCTS.includes(values.type) ? parseIds(values.productIds) : undefined,
    categoryIds: values.type === 'Category' ? parseIds(values.categoryIds) : undefined,
  }
}

// ─── Promotion Form Modal ─────────────────────────────────────────────────────

interface PromotionFormModalProps {
  isOpen: boolean
  onClose: () => void
  editing?: PromotionDetail | null
}

function PromotionFormModal({ isOpen, onClose, editing }: PromotionFormModalProps) {
  const { mutate: createPromotion, isPending: isCreating } = useCreatePromotion()
  const { mutate: updatePromotion, isPending: isUpdating } = useUpdatePromotion()
  const isPending = isCreating || isUpdating

  const { register, handleSubmit, watch, control, reset } = useForm<PromotionFormValues>({
    defaultValues: editing ? promotionToFormValues(editing as PromotionDetail) : defaultFormValues,
  })

  const type = watch('type')

  const onSubmit = useCallback((values: PromotionFormValues) => {
    const payload = formValuesToRequest(values)
    if (editing) {
      updatePromotion(
        { id: editing.id, data: payload as UpdatePromotionRequest },
        { onSuccess: () => { onClose(); reset() } },
      )
    } else {
      createPromotion(payload, { onSuccess: () => { onClose(); reset() } })
    }
  }, [editing, createPromotion, updatePromotion, onClose, reset])

  const inputCls = cn(
    'w-full px-3 py-2 rounded-xl text-sm',
    'bg-obsidian-800 border border-neutral-800 text-white placeholder:text-neutral-600',
    'focus:outline-none focus:ring-1 focus:ring-gold-500/50 focus:border-gold-500/50',
  )
  const labelCls = 'text-xs font-medium text-neutral-400 mb-1 block'

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? 'Editar promoción' : 'Nueva promoción'}
      size="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        {/* Nombre + Tipo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nombre *</label>
            <input {...register('name', { required: true })} className={inputCls} placeholder="Ej. Descuento verano" />
          </div>
          <div>
            <label className={labelCls}>Tipo *</label>
            <select {...register('type')} className={inputCls}>
              {PROMOTION_TYPES.map(t => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className={labelCls}>Descripción</label>
          <textarea {...register('description')} rows={2} className={cn(inputCls, 'resize-none')} placeholder="Descripción opcional..." />
        </div>

        {/* Badge */}
        <div>
          <label className={labelCls}>Badge (etiqueta visible, opcional)</label>
          <input {...register('badge')} className={inputCls} placeholder="Ej. Flash, Oferta Semanal" />
        </div>

        {/* Descuento */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Tipo de descuento *</label>
            <select {...register('discountType')} className={inputCls}>
              <option value="Percentage">Porcentaje</option>
              <option value="FixedAmount">Monto fijo</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Valor *</label>
            <input {...register('discountValue', { required: true })} type="number" step="0.01" className={inputCls} placeholder="0" />
          </div>
          <div>
            <label className={labelCls}>Moneda</label>
            <select {...register('currency')} className={inputCls}>
              <option value="ARS">ARS ($)</option>
              <option value="USD">USD ($)</option>
              <option value="ARS">ARS ($)</option>
            </select>
          </div>
        </div>

        {/* Período */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Inicia *</label>
            <input {...register('startsAt', { required: true })} type="datetime-local" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Termina (opcional)</label>
            <input {...register('endsAt')} type="datetime-local" className={inputCls} />
          </div>
        </div>

        {/* Prioridad + Acumulable */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Prioridad</label>
            <input {...register('priority')} type="number" className={inputCls} placeholder="0" />
          </div>
          <div className="flex flex-col justify-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <Controller
                control={control}
                name="isStackable"
                render={({ field }) => (
                  <input
                    type="checkbox"
                    className="accent-gold-500 h-4 w-4"
                    checked={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <span className="text-sm text-neutral-300">Acumulable con otras promociones</span>
            </label>
          </div>
        </div>

        {/* ─── Conditional fields ─────────────────────────────── */}

        {/* BuyXGetY */}
        {type === 'BuyXGetY' && (
          <div className="rounded-xl border border-neutral-800 p-4 space-y-3">
            <p className="text-xs font-semibold text-gold-400 uppercase tracking-wider">Lleva X Paga Y</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Cantidad a comprar (X) *</label>
                <input {...register('buyQuantity', { required: true })} type="number" min="1" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Cantidad a recibir (Y) *</label>
                <input {...register('getQuantity', { required: true })} type="number" min="1" className={inputCls} />
              </div>
            </div>
          </div>
        )}

        {/* Flash / HappyHour time window */}
        {TYPES_WITH_TIME.includes(type) && (
          <div className="rounded-xl border border-neutral-800 p-4 space-y-3">
            <p className="text-xs font-semibold text-gold-400 uppercase tracking-wider">Ventana horaria</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Hora de inicio</label>
                <input {...register('activeFrom')} type="time" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Hora de fin</label>
                <input {...register('activeUntil')} type="time" className={inputCls} />
              </div>
            </div>
          </div>
        )}

        {/* MinAmount */}
        {type === 'MinAmount' && (
          <div className="rounded-xl border border-neutral-800 p-4">
            <label className={labelCls}>Monto mínimo de pedido *</label>
            <input {...register('minOrderAmount', { required: true })} type="number" step="0.01" className={inputCls} placeholder="0.00" />
          </div>
        )}

        {/* Combo price */}
        {type === 'Combo' && (
          <div className="rounded-xl border border-neutral-800 p-4">
            <label className={labelCls}>Precio combo (opcional)</label>
            <input {...register('comboPrice')} type="number" step="0.01" className={inputCls} placeholder="0.00" />
          </div>
        )}

        {/* Product IDs */}
        {TYPES_WITH_PRODUCTS.includes(type) && (
          <div className="rounded-xl border border-neutral-800 p-4">
            <label className={labelCls}>IDs de productos (separados por coma)</label>
            <textarea
              {...register('productIds')}
              rows={3}
              className={cn(inputCls, 'resize-none font-mono text-xs')}
              placeholder="uuid1, uuid2, uuid3..."
            />
          </div>
        )}

        {/* Category IDs */}
        {type === 'Category' && (
          <div className="rounded-xl border border-neutral-800 p-4">
            <label className={labelCls}>IDs de categorías (separados por coma)</label>
            <textarea
              {...register('categoryIds')}
              rows={3}
              className={cn(inputCls, 'resize-none font-mono text-xs')}
              placeholder="uuid1, uuid2, uuid3..."
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => { onClose(); reset() }}
            className="flex-1 py-2.5 rounded-xl border border-neutral-700 text-sm text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-semibold text-sm transition-colors disabled:opacity-60"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {isPending ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear promoción'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Promotions Table Row ─────────────────────────────────────────────────────

interface PromotionRowProps {
  promotion: PromotionListItem
  onEdit: (p: PromotionListItem) => void
}

function PromotionRow({ promotion, onEdit }: PromotionRowProps) {
  const { mutate: toggle, isPending: isToggling } = useTogglePromotion()
  const { mutate: duplicate, isPending: isDuplicating } = useDuplicatePromotion()

  const isActive = promotion.isActive
  const discountLabel =
    promotion.discountType === 'Percentage'
      ? `${promotion.discountValue}%`
      : `${promotion.currency} ${formatMoney(promotion.discountValue)}`

  return (
    <tr className="border-b border-neutral-800/60 hover:bg-obsidian-800/30 transition-colors group">
      {/* Nombre */}
      <td className="px-4 py-3">
        <div>
          <p className="text-sm font-medium text-white">{promotion.name}</p>
          {promotion.badge && (
            <span className="text-xs text-gold-400 font-medium">{promotion.badge}</span>
          )}
        </div>
      </td>

      {/* Tipo */}
      <td className="px-4 py-3">
        <TypeBadge type={promotion.type} />
      </td>

      {/* Badge label */}
      <td className="px-4 py-3">
        {promotion.badge
          ? <Badge variant="gold" size="sm">{promotion.badge}</Badge>
          : <span className="text-neutral-600 text-xs">—</span>}
      </td>

      {/* Descuento */}
      <td className="px-4 py-3">
        <span className="text-sm font-semibold text-white">{discountLabel}</span>
      </td>

      {/* Período */}
      <td className="px-4 py-3">
        <p className="text-xs text-neutral-400">{formatDate(promotion.startsAt)}</p>
        {promotion.endsAt && (
          <p className="text-xs text-neutral-600">hasta {formatDate(promotion.endsAt)}</p>
        )}
      </td>

      {/* Estado */}
      <td className="px-4 py-3">
        {isActive
          ? <Badge variant="success" dot size="sm">Activa</Badge>
          : <Badge variant="secondary" dot size="sm">Inactiva</Badge>}
      </td>

      {/* Acciones */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Toggle */}
          <button
            onClick={() => toggle(promotion.id)}
            disabled={isToggling}
            title={isActive ? 'Desactivar' : 'Activar'}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-obsidian-700 transition-colors disabled:opacity-40"
          >
            {isActive
              ? <ToggleRight className="h-4 w-4 text-success-400" />
              : <ToggleLeft className="h-4 w-4" />}
          </button>

          {/* Edit */}
          <button
            onClick={() => onEdit(promotion)}
            title="Editar"
            className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-obsidian-700 transition-colors"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>

          {/* Duplicate */}
          <button
            onClick={() => duplicate(promotion.id)}
            disabled={isDuplicating}
            title="Duplicar"
            className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-obsidian-700 transition-colors disabled:opacity-40"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Promotions List Tab ──────────────────────────────────────────────────────

interface PromotionsListTabProps {
  onNew: () => void
  onEdit: (p: PromotionListItem) => void
}

function PromotionsListTab({ onNew, onEdit }: PromotionsListTabProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<PromotionType | ''>('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search, 350)

  const params: Record<string, unknown> = { page, pageSize: 25 }
  if (debouncedSearch) params.search = debouncedSearch
  if (typeFilter) params.type = typeFilter
  if (activeFilter !== 'all') params.isActive = activeFilter === 'active'

  const { data, isLoading } = usePromotions(params)

  const hasFilters = !!search || !!typeFilter || activeFilter !== 'all'

  const inputCls = cn(
    'px-3 py-2 rounded-xl text-sm',
    'bg-obsidian-800 border border-neutral-800 text-white placeholder:text-neutral-600',
    'focus:outline-none focus:ring-1 focus:ring-gold-500/50',
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-semibold text-white tracking-wide">Promociones</h1>
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-semibold text-sm transition-colors"
        >
          <Plus className="h-4 w-4" /> Nueva promoción
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 pointer-events-none" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar promociones..."
            className={cn(inputCls, 'w-full pl-9 pr-4')}
          />
        </div>

        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value as PromotionType | ''); setPage(1) }}
          className={inputCls}
        >
          <option value="">Todos los tipos</option>
          {PROMOTION_TYPES.map(t => (
            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
          ))}
        </select>

        <select
          value={activeFilter}
          onChange={e => { setActiveFilter(e.target.value as typeof activeFilter); setPage(1) }}
          className={inputCls}
        >
          <option value="all">Todos</option>
          <option value="active">Activas</option>
          <option value="inactive">Inactivas</option>
        </select>

        {hasFilters && (
          <button
            onClick={() => { setSearch(''); setTypeFilter(''); setActiveFilter('all'); setPage(1) }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700 transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Limpiar
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-neutral-800 overflow-hidden" style={{ background: 'var(--surface)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-800 bg-obsidian-800/50">
                {['Nombre', 'Tipo', 'Badge', 'Descuento', 'Período', 'Estado', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-neutral-500 text-sm">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Cargando promociones...
                  </td>
                </tr>
              ) : !data?.items?.length ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-neutral-500">
                    <Tag className="h-8 w-8 mx-auto mb-2 text-neutral-700" />
                    No hay promociones que coincidan con los filtros.
                  </td>
                </tr>
              ) : data.items.map((p: PromotionListItem) => (
                <PromotionRow key={p.id} promotion={p} onEdit={onEdit} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && (data as any).totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-800">
            <p className="text-xs text-neutral-500">
              {(data as any).totalCount} promociones · página {(data as any).page} de {(data as any).totalPages}
            </p>
            <div className="flex gap-1">
              <button
                disabled={!(data as any).hasPreviousPage}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg text-xs border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <button
                disabled={!(data as any).hasNextPage}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg text-xs border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardTab() {
  const { data, isLoading } = usePromotionsDashboard()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-semibold text-white tracking-wide">Dashboard de Promociones</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          label="Activas"
          value={isLoading ? '—' : data?.totalActive ?? 0}
          icon={<CheckCircle2 className="h-4 w-4" />}
          gold
          loading={isLoading}
        />
        <StatCard
          label="Expiradas"
          value={isLoading ? '—' : data?.totalExpired ?? 0}
          icon={<XCircle className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          label="Inactivas"
          value={isLoading ? '—' : data?.totalInactive ?? 0}
          icon={<ToggleLeft className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          label="Flash Sales"
          value={isLoading ? '—' : data?.flashCount ?? 0}
          icon={<Zap className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          label="Lleva X Paga Y"
          value={isLoading ? '—' : data?.buyXGetYCount ?? 0}
          icon={<Gift className="h-4 w-4" />}
          loading={isLoading}
        />
        <StatCard
          label="Combos"
          value={isLoading ? '—' : data?.comboCount ?? 0}
          icon={<Star className="h-4 w-4" />}
          loading={isLoading}
        />
      </div>

      {/* Active promotions table */}
      <div className="rounded-2xl border border-neutral-800 overflow-hidden" style={{ background: 'var(--surface)' }}>
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-success-400" />
          <h2 className="text-sm font-semibold text-white">Promociones activas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-800 bg-obsidian-800/50">
                {['Nombre', 'Tipo', 'Badge', 'Termina', 'Acumulable'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-500 text-sm">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Cargando...
                  </td>
                </tr>
              ) : !data?.activePromotions?.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                    <Tag className="h-6 w-6 mx-auto mb-2 text-neutral-700" />
                    No hay promociones activas.
                  </td>
                </tr>
              ) : data.activePromotions.map(p => (
                <tr key={p.id} className="border-b border-neutral-800/60 hover:bg-obsidian-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-white">{p.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <TypeBadge type={p.type as PromotionType} />
                  </td>
                  <td className="px-4 py-3">
                    {p.badge
                      ? <Badge variant="gold" size="sm">{p.badge}</Badge>
                      : <span className="text-neutral-600 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-neutral-400">{formatDateTime(p.endsAt)}</span>
                  </td>
                  <td className="px-4 py-3">
                    {p.isStackable
                      ? <Badge variant="success" size="sm">Sí</Badge>
                      : <Badge variant="secondary" size="sm">No</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'promotions' | 'dashboard'

export default function PromotionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('promotions')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<PromotionDetail | null>(null)

  const handleNew = useCallback(() => {
    setEditingPromotion(null)
    setModalOpen(true)
  }, [])

  const handleEdit = useCallback((p: PromotionListItem) => {
    // Cast to PromotionDetail — full detail would be fetched in a real scenario,
    // here we use available fields and the form handles missing optional fields gracefully.
    setEditingPromotion(p as unknown as PromotionDetail)
    setModalOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    setModalOpen(false)
    setEditingPromotion(null)
  }, [])

  const tabCls = (t: Tab) => cn(
    'px-4 py-2 text-sm font-medium rounded-xl transition-colors',
    activeTab === t
      ? 'bg-gold-500/15 text-gold-400 border border-gold-500/30'
      : 'text-neutral-500 hover:text-white hover:bg-obsidian-800',
  )

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        <button className={tabCls('promotions')} onClick={() => setActiveTab('promotions')}>
          Promociones
        </button>
        <button className={tabCls('dashboard')} onClick={() => setActiveTab('dashboard')}>
          Dashboard
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'promotions' && (
        <PromotionsListTab onNew={handleNew} onEdit={handleEdit} />
      )}
      {activeTab === 'dashboard' && <DashboardTab />}

      {/* Form Modal */}
      <PromotionFormModal
        isOpen={modalOpen}
        onClose={handleClose}
        editing={editingPromotion}
      />
    </div>
  )
}
