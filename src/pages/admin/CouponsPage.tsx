import { useState } from 'react'
import { Plus, Eye, EyeOff, Pencil, Trash2, List } from 'lucide-react'
import {
  useCoupons,
  useCreateCoupon,
  useUpdateCoupon,
  useToggleCoupon,
  useDeleteCoupon,
  useCouponUsages,
} from '@/features/promotions/hooks/usePromotions'
import type { CouponListItem, CreateCouponRequest } from '@/types/promotions.types'
import { Modal }      from '@/components/ui/Modal/Modal'
import { Button }     from '@/components/ui/Button/Button'
import { Badge }      from '@/components/ui/Badge/Badge'
import { Input }      from '@/components/ui/Input/Input'
import { Select }     from '@/components/ui/Select/Select'
import { Pagination } from '@/components/data-display/Pagination/Pagination'
import { formatMoney } from '@/utils/helpers/formatMoney'

// ─── Opciones ────────────────────────────────────────────────────────────────

const TYPE_FILTER_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'Percentage', label: 'Porcentaje' },
  { value: 'FixedAmount', label: 'Monto fijo' },
  { value: 'FreeShipping', label: 'Envío gratis' },
]

const TYPE_FORM_OPTIONS = [
  { value: 'Percentage', label: 'Porcentaje (%)' },
  { value: 'FixedAmount', label: 'Monto fijo' },
  { value: 'FreeShipping', label: 'Envío gratis' },
]

const ACTIVE_OPTIONS = [
  { value: '', label: 'Estado (todos)' },
  { value: 'true', label: 'Activo' },
  { value: 'false', label: 'Inactivo' },
]

const CURRENCY_OPTIONS = [
  { value: 'ARS', label: 'ARS ($)' },
  { value: 'USD', label: 'USD ($)' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  Percentage: 'Porcentaje',
  FixedAmount: 'Monto fijo',
  FreeShipping: 'Envío gratis',
}

function formatValue(item: CouponListItem) {
  if (item.type === 'Percentage') return `${item.value}%`
  if (item.type === 'FreeShipping') return '—'
  return item.currency === 'USD' ? `$ ${formatMoney(item.value)}` : `$ ${formatMoney(item.value)}`
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const EMPTY_FORM: CreateCouponRequest = {
  code: '', name: '', type: 'Percentage', value: 0, currency: 'ARS',
  description: '', isStackable: false,
  minOrderAmount: undefined, maxDiscountAmount: undefined,
  usageLimit: undefined, usageLimitPerUser: undefined,
  startsAt: '', endsAt: '',
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function CouponsPage() {
  const [activeTab, setActiveTab]     = useState<'coupons' | 'usages'>('coupons')
  const [search, setSearch]           = useState('')
  const [filterType, setFilterType]   = useState('')
  const [filterActive, setFilterActive] = useState('')
  const [page, setPage]               = useState(1)
  const [createOpen, setCreateOpen]   = useState(false)
  const [editing, setEditing]         = useState<CouponListItem | null>(null)
  const [deleting, setDeleting]       = useState<CouponListItem | null>(null)
  const [usagesTarget, setUsagesTarget] = useState<CouponListItem | null>(null)
  const [usagesPage, setUsagesPage]   = useState(1)
  const [form, setForm]               = useState<CreateCouponRequest>(EMPTY_FORM)

  const { data, isLoading } = useCoupons({ search, type: filterType, isActive: filterActive, page, pageSize: 10 })
  const createCoupon = useCreateCoupon()
  const updateCoupon = useUpdateCoupon()
  const toggleCoupon = useToggleCoupon()
  const deleteCoupon = useDeleteCoupon()

  const { data: usagesData, isLoading: isUsagesLoading } = useCouponUsages(
    usagesTarget?.id ?? '', usagesPage, 10,
  )

  const coupons: CouponListItem[] = data?.items ?? []
  const totalPages = data?.totalPages ?? 1
  const usageItems = usagesData?.items ?? []
  const usagesTotalPages = usagesData?.totalPages ?? 1

  function openCreate() { setForm(EMPTY_FORM); setEditing(null); setCreateOpen(true) }

  function openEdit(item: CouponListItem) {
    setForm({
      code: item.code, name: item.name, type: item.type, value: item.value,
      currency: item.currency ?? 'ARS', description: item.description ?? '',
      isStackable: item.isStackable ?? false, minOrderAmount: undefined,
      maxDiscountAmount: undefined, usageLimit: item.usageLimit,
      usageLimitPerUser: undefined,
      startsAt: item.startsAt ? item.startsAt.slice(0, 10) : '',
      endsAt: item.endsAt ? item.endsAt.slice(0, 10) : '',
    })
    setEditing(item); setCreateOpen(false)
  }

  function closeModal() { setCreateOpen(false); setEditing(null) }

  function field<K extends keyof CreateCouponRequest>(key: K, value: CreateCouponRequest[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editing) {
      const { code: _code, ...rest } = form
      await updateCoupon.mutateAsync({ id: editing.id, data: { ...rest, id: editing.id } })
    } else {
      await createCoupon.mutateAsync(form)
    }
    closeModal()
  }

  async function handleDelete() {
    if (!deleting) return
    await deleteCoupon.mutateAsync(deleting.id)
    setDeleting(null)
  }

  const isSaving     = createCoupon.isPending || updateCoupon.isPending
  const isDeleting   = deleteCoupon.isPending
  const isFreeShipping = form.type === 'FreeShipping'

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-100">Cupones</h1>
        {activeTab === 'coupons' && (
          <Button variant="primary" size="md" leftIcon={<Plus size={16} />} onClick={openCreate}>
            Nuevo cupón
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-neutral-700 bg-obsidian-800 p-1 w-fit">
        {(['coupons', 'usages'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab ? 'bg-obsidian-700 text-neutral-100' : 'text-neutral-400 hover:text-neutral-200'
            }`}>
            {tab === 'coupons' ? 'Cupones' : 'Usos recientes'}
          </button>
        ))}
      </div>

      {/* ── Pestaña Cupones ──────────────────────────────────────────────────── */}
      {activeTab === 'coupons' && (
        <>
          {/* Filtros */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Input
              placeholder="Buscar por código o nombre..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
            <Select
              options={TYPE_FILTER_OPTIONS}
              value={filterType}
              onChange={v => { setFilterType(v as string); setPage(1) }}
            />
            <Select
              options={ACTIVE_OPTIONS}
              value={filterActive}
              onChange={v => { setFilterActive(v as string); setPage(1) }}
            />
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto rounded-xl border border-neutral-700 bg-obsidian-800">
            <table className="w-full text-sm text-neutral-300">
              <thead>
                <tr className="border-b border-neutral-700 text-left text-xs uppercase tracking-wider text-neutral-500">
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Usos / Límite</th>
                  <th className="px-4 py-3">Vencimiento</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-neutral-500">Cargando...</td></tr>
                ) : coupons.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-neutral-500">No se encontraron cupones.</td></tr>
                ) : coupons.map(item => (
                  <tr key={item.id} className="border-b border-neutral-700/50 transition-colors hover:bg-obsidian-700/40">
                    <td className="px-4 py-3">
                      <span className="rounded bg-obsidian-900 px-2 py-0.5 font-mono text-xs text-gold-400 border border-neutral-700">
                        {item.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-100">{item.name}</td>
                    <td className="px-4 py-3">
                      <Badge variant="info">{TYPE_LABEL[item.type] ?? item.type}</Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-gold-400">{formatValue(item)}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {item.usedCount ?? 0} / {item.usageLimit != null ? item.usageLimit : '∞'}
                    </td>
                    <td className="px-4 py-3 text-neutral-400">{formatDate(item.endsAt)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={item.isActive ? 'success' : 'neutral'}>
                        {item.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button title={item.isActive ? 'Desactivar' : 'Activar'}
                          onClick={() => toggleCoupon.mutate(item.id)}
                          className="rounded p-1.5 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white">
                          {item.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button title="Editar" onClick={() => openEdit(item)}
                          className="rounded p-1.5 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white">
                          <Pencil size={14} />
                        </button>
                        <button title="Ver usos" onClick={() => { setUsagesTarget(item); setUsagesPage(1) }}
                          className="rounded p-1.5 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white">
                          <List size={14} />
                        </button>
                        <button title="Eliminar" onClick={() => setDeleting(item)}
                          className="rounded p-1.5 text-neutral-400 transition-colors hover:bg-red-900/50 hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
        </>
      )}

      {/* ── Pestaña Usos ─────────────────────────────────────────────────────── */}
      {activeTab === 'usages' && (
        <div className="flex flex-col gap-4">
          {usagesTarget ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-400">Usos de:</span>
                <span className="rounded bg-obsidian-900 px-2 py-0.5 font-mono text-xs text-gold-400 border border-neutral-700">
                  {usagesTarget.code}
                </span>
                <button onClick={() => setUsagesTarget(null)} className="text-xs text-neutral-500 hover:text-white">
                  Limpiar
                </button>
              </div>
              <div className="overflow-x-auto rounded-xl border border-neutral-700 bg-obsidian-800">
                <table className="w-full text-sm text-neutral-300">
                  <thead>
                    <tr className="border-b border-neutral-700 text-left text-xs uppercase tracking-wider text-neutral-500">
                      <th className="px-4 py-3">Pedido</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Monto descontado</th>
                      <th className="px-4 py-3">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isUsagesLoading ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-neutral-500">Cargando...</td></tr>
                    ) : usageItems.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-neutral-500">Sin usos registrados.</td></tr>
                    ) : usageItems.map(u => (
                      <tr key={u.id} className="border-b border-neutral-700/50 transition-colors hover:bg-obsidian-700/40">
                        <td className="px-4 py-3 font-mono text-xs">{u.orderId}</td>
                        <td className="px-4 py-3 text-neutral-400">{u.customerId ?? '—'}</td>
                        <td className="px-4 py-3 text-gold-400">$ {formatMoney(u.discountAmount)}</td>
                        <td className="px-4 py-3 text-neutral-400">{formatDate(u.usedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {usagesTotalPages > 1 && <Pagination page={usagesPage} totalPages={usagesTotalPages} onPageChange={setUsagesPage} />}
            </>
          ) : (
            <p className="text-sm text-neutral-500">
              Selecciona un cupón desde la pestaña "Cupones" haciendo clic en el ícono de lista.
            </p>
          )}
        </div>
      )}

      {/* ── Modal Crear / Editar ─────────────────────────────────────────────── */}
      <Modal isOpen={createOpen || !!editing} onClose={closeModal}
        title={editing ? `Editar cupón — ${editing.code}` : 'Nuevo cupón'} size="lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-400">Código *</label>
              <Input required={!editing} readOnly={!!editing}
                value={form.code} onChange={e => field('code', e.target.value.toUpperCase())}
                placeholder="Ej. VERANO20" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-400">Nombre *</label>
              <Input required value={form.name} onChange={e => field('name', e.target.value)}
                placeholder="Ej. Descuento verano 20%" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-400">Tipo *</label>
              <Select
                options={TYPE_FORM_OPTIONS}
                value={form.type}
                onChange={v => {
                  field('type', v as CreateCouponRequest['type'])
                  if (v === 'FreeShipping') field('value', 0)
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-400">Valor *</label>
              <Input type="number" min={0} step="0.01"
                disabled={isFreeShipping} required={!isFreeShipping}
                value={isFreeShipping ? '' : (form.value || '')}
                onChange={e => field('value', parseFloat(e.target.value) || 0)}
                placeholder={isFreeShipping ? 'N/A' : '0'} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-400">Moneda</label>
              <Select
                options={CURRENCY_OPTIONS}
                value={form.currency}
                onChange={v => field('currency', v as string)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-neutral-400">Descripción</label>
            <textarea rows={2} value={form.description ?? ''} onChange={e => field('description', e.target.value)}
              placeholder="Descripción opcional..."
              className="w-full resize-none rounded-lg border border-neutral-700 bg-obsidian-900 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 outline-none focus:border-gold-400" />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-300">
            <input type="checkbox" checked={form.isStackable ?? false}
              onChange={e => field('isStackable', e.target.checked)}
              className="h-4 w-4 rounded border-neutral-600 accent-gold-400" />
            Acumulable con otros descuentos
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-400">Monto mínimo de pedido</label>
              <Input type="number" min={0} step="0.01" value={form.minOrderAmount ?? ''}
                onChange={e => field('minOrderAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Opcional" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-400">Descuento máximo</label>
              <Input type="number" min={0} step="0.01" value={form.maxDiscountAmount ?? ''}
                onChange={e => field('maxDiscountAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="Opcional" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-400">Usos máximos (total)</label>
              <Input type="number" min={1} value={form.usageLimit ?? ''}
                onChange={e => field('usageLimit', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Ilimitado" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-400">Usos máx. por usuario</label>
              <Input type="number" min={1} value={form.usageLimitPerUser ?? ''}
                onChange={e => field('usageLimitPerUser', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Ilimitado" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-400">Inicio</label>
              <Input type="date" value={form.startsAt ?? ''} onChange={e => field('startsAt', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-400">Vencimiento</label>
              <Input type="date" value={form.endsAt ?? ''} onChange={e => field('endsAt', e.target.value)} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" size="md" type="button" onClick={closeModal}>Cancelar</Button>
            <Button variant="primary" size="md" type="submit" loading={isSaving}>
              {editing ? 'Guardar cambios' : 'Crear cupón'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal Usos ───────────────────────────────────────────────────────── */}
      <Modal isOpen={!!usagesTarget} onClose={() => setUsagesTarget(null)}
        title={`Usos de ${usagesTarget?.code ?? ''}`} size="lg">
        <div className="flex flex-col gap-4">
          <div className="overflow-x-auto rounded-xl border border-neutral-700">
            <table className="w-full text-sm text-neutral-300">
              <thead>
                <tr className="border-b border-neutral-700 text-left text-xs uppercase tracking-wider text-neutral-500">
                  <th className="px-4 py-3">Pedido</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Monto descontado</th>
                  <th className="px-4 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {isUsagesLoading ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-neutral-500">Cargando...</td></tr>
                ) : usageItems.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-neutral-500">Sin usos registrados.</td></tr>
                ) : usageItems.map(u => (
                  <tr key={u.id} className="border-b border-neutral-700/50 transition-colors hover:bg-obsidian-700/40">
                    <td className="px-4 py-3 font-mono text-xs">{u.orderId}</td>
                    <td className="px-4 py-3 text-neutral-400">{u.customerId ?? '—'}</td>
                    <td className="px-4 py-3 text-gold-400">$ {formatMoney(u.discountAmount)}</td>
                    <td className="px-4 py-3 text-neutral-400">{formatDate(u.usedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {usagesTotalPages > 1 && <Pagination page={usagesPage} totalPages={usagesTotalPages} onPageChange={setUsagesPage} />}
          <div className="flex justify-end">
            <Button variant="ghost" size="md" onClick={() => setUsagesTarget(null)}>Cerrar</Button>
          </div>
        </div>
      </Modal>

      {/* ── Modal Eliminar ───────────────────────────────────────────────────── */}
      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Eliminar cupón" size="sm">
        <p className="mb-5 text-sm text-neutral-300">
          ¿Eliminar el cupón <span className="font-mono text-gold-400">{deleting?.code}</span>?
          Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" size="md" onClick={() => setDeleting(null)}>Cancelar</Button>
          <Button variant="danger" size="md" leftIcon={<Trash2 size={14} />}
            onClick={handleDelete} loading={isDeleting}>
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  )
}
