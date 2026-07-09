import { useState } from 'react'
import { Plus, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react'
import {
  useDiscounts,
  useCreateDiscount,
  useUpdateDiscount,
  useDeleteDiscount,
  useToggleDiscount,
} from '@/features/promotions/hooks/usePromotions'
import type { DiscountListItem, CreateDiscountRequest } from '@/types/promotions.types'
import { Modal }      from '@/components/ui/Modal/Modal'
import { Button }     from '@/components/ui/Button/Button'
import { Badge }      from '@/components/ui/Badge/Badge'
import { Input }      from '@/components/ui/Input/Input'
import { Select }     from '@/components/ui/Select/Select'
import { StatCard }   from '@/components/data-display/StatCard/StatCard'
import { Pagination } from '@/components/data-display/Pagination/Pagination'
import { formatMoney } from '@/utils/helpers/formatMoney'

// ─── Opciones de los selects ──────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: '', label: 'Todos los tipos' },
  { value: 'Percentage', label: 'Porcentaje' },
  { value: 'FixedAmount', label: 'Monto fijo' },
]

const TYPE_FORM_OPTIONS = [
  { value: 'Percentage', label: 'Porcentaje (%)' },
  { value: 'FixedAmount', label: 'Monto fijo' },
]

const APPLIES_OPTIONS = [
  { value: '', label: 'Aplica a (todos)' },
  { value: 'Product', label: 'Producto' },
  { value: 'Category', label: 'Categoría' },
  { value: 'Order', label: 'Pedido' },
  { value: 'Cart', label: 'Carrito' },
  { value: 'Customer', label: 'Cliente' },
]

const APPLIES_FORM_OPTIONS = [
  { value: 'Product', label: 'Producto' },
  { value: 'Category', label: 'Categoría' },
  { value: 'Order', label: 'Pedido' },
  { value: 'Cart', label: 'Carrito' },
  { value: 'Customer', label: 'Cliente' },
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

const TYPE_LABEL: Record<string, string> = { Percentage: 'Porcentaje', FixedAmount: 'Monto fijo' }
const APPLIES_LABEL: Record<string, string> = {
  Product: 'Producto', Category: 'Categoría', Order: 'Pedido', Cart: 'Carrito', Customer: 'Cliente',
}

function formatValue(item: DiscountListItem) {
  if (item.type === 'Percentage') return `${item.value}%`
  return item.currency === 'USD' ? `$ ${formatMoney(item.value)}` : `$ ${formatMoney(item.value)}`
}

const EMPTY_FORM: CreateDiscountRequest = {
  name: '', type: 'Percentage', value: 0, currency: 'ARS', appliesTo: 'Order',
  description: '', isStackable: false, priority: 0,
  minOrderAmount: undefined, maxDiscountAmount: undefined, minQuantity: undefined,
  startsAt: '', endsAt: '', maxUsage: undefined,
}

// ─── Componente principal ──────────────────────────────────────────────────────

export default function DiscountsPage() {
  const [search, setSearch]               = useState('')
  const [filterType, setFilterType]       = useState('')
  const [filterAppliesTo, setFilterAppliesTo] = useState('')
  const [filterActive, setFilterActive]   = useState('')
  const [page, setPage]                   = useState(1)
  const [createOpen, setCreateOpen]       = useState(false)
  const [editing, setEditing]             = useState<DiscountListItem | null>(null)
  const [deleting, setDeleting]           = useState<DiscountListItem | null>(null)
  const [form, setForm]                   = useState<CreateDiscountRequest>(EMPTY_FORM)

  const { data, isLoading } = useDiscounts({
    search, type: filterType, appliesTo: filterAppliesTo, isActive: filterActive, page,
  })
  const createDiscount = useCreateDiscount()
  const updateDiscount = useUpdateDiscount()
  const deleteDiscount = useDeleteDiscount()
  const toggleDiscount = useToggleDiscount()

  const discounts: DiscountListItem[] = data?.items ?? []
  const totalPages = data?.totalPages ?? 1
  const total      = data?.totalCount ?? discounts.length
  const activeCount = discounts.filter(d => d.isActive).length

  function openCreate() { setForm(EMPTY_FORM); setEditing(null); setCreateOpen(true) }

  function openEdit(item: DiscountListItem) {
    setForm({
      name: item.name, type: item.type, value: item.value,
      currency: item.currency ?? 'ARS', appliesTo: item.appliesTo,
      description: item.description ?? '', isStackable: item.isStackable ?? false,
      priority: item.priority ?? 0, minOrderAmount: item.minOrderAmount,
      maxDiscountAmount: item.maxDiscountAmount, minQuantity: item.minQuantity,
      startsAt: item.startsAt ? item.startsAt.slice(0, 10) : '',
      endsAt: item.endsAt ? item.endsAt.slice(0, 10) : '',
      maxUsage: item.maxUsage,
    })
    setEditing(item); setCreateOpen(false)
  }

  function closeModal() { setCreateOpen(false); setEditing(null) }

  function field<K extends keyof CreateDiscountRequest>(key: K, value: CreateDiscountRequest[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editing) await updateDiscount.mutateAsync({ id: editing.id, data: form })
    else await createDiscount.mutateAsync(form)
    closeModal()
  }

  async function handleDelete() {
    if (!deleting) return
    await deleteDiscount.mutateAsync(deleting.id)
    setDeleting(null)
  }

  const isSaving   = createDiscount.isPending || updateDiscount.isPending
  const isDeleting = deleteDiscount.isPending

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-100">Descuentos</h1>
        <Button variant="primary" size="md" leftIcon={<Plus size={16} />} onClick={openCreate}>
          Nuevo descuento
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total descuentos" value={total} />
        <StatCard label="Activos" value={activeCount} />
        <StatCard label="Páginas" value={`${page} / ${totalPages}`} />
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          placeholder="Buscar por nombre..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <Select
          options={TYPE_OPTIONS}
          value={filterType}
          onChange={v => { setFilterType(v as string); setPage(1) }}
        />
        <Select
          options={APPLIES_OPTIONS}
          value={filterAppliesTo}
          onChange={v => { setFilterAppliesTo(v as string); setPage(1) }}
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
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Aplica a</th>
              <th className="px-4 py-3">Prioridad</th>
              <th className="px-4 py-3">Usos</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-neutral-500">Cargando...</td></tr>
            ) : discounts.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-neutral-500">No se encontraron descuentos.</td></tr>
            ) : discounts.map(item => (
              <tr key={item.id} className="border-b border-neutral-700/50 transition-colors hover:bg-obsidian-700/40">
                <td className="px-4 py-3 font-medium text-neutral-100">{item.name}</td>
                <td className="px-4 py-3">
                  <Badge variant="info">{TYPE_LABEL[item.type] ?? item.type}</Badge>
                </td>
                <td className="px-4 py-3 font-mono text-gold-400">{formatValue(item)}</td>
                <td className="px-4 py-3">{APPLIES_LABEL[item.appliesTo] ?? item.appliesTo}</td>
                <td className="px-4 py-3">{item.priority ?? 0}</td>
                <td className="px-4 py-3">
                  {item.usageCount ?? 0}{item.maxUsage ? ` / ${item.maxUsage}` : ''}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={item.isActive ? 'success' : 'neutral'}>
                    {item.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      title={item.isActive ? 'Desactivar' : 'Activar'}
                      onClick={() => toggleDiscount.mutate(item.id)}
                      className="rounded p-1.5 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
                    >
                      {item.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      title="Editar"
                      onClick={() => openEdit(item)}
                      className="rounded p-1.5 text-neutral-400 transition-colors hover:bg-neutral-700 hover:text-white"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      title="Eliminar"
                      onClick={() => setDeleting(item)}
                      className="rounded p-1.5 text-neutral-400 transition-colors hover:bg-red-900/50 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      {/* ── Modal crear / editar ─────────────────────────────────────────────── */}
      <Modal isOpen={createOpen || !!editing} onClose={closeModal}
        title={editing ? 'Editar descuento' : 'Nuevo descuento'} size="lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-neutral-400">Nombre *</label>
            <Input required value={form.name} onChange={e => field('name', e.target.value)}
              placeholder="Ej. Descuento verano 20%" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-400">Tipo *</label>
              <Select
                options={TYPE_FORM_OPTIONS}
                value={form.type}
                onChange={v => field('type', v as CreateDiscountRequest['type'])}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-400">Valor *</label>
              <Input type="number" min={0.01} step="0.01" required
                value={form.value || ''} onChange={e => field('value', parseFloat(e.target.value) || 0)}
                placeholder="0" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-400">Moneda</label>
              <Select
                options={CURRENCY_OPTIONS}
                value={form.currency}
                onChange={v => field('currency', v as 'ARS' | 'USD')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-400">Aplica a</label>
              <Select
                options={APPLIES_FORM_OPTIONS}
                value={form.appliesTo}
                onChange={v => field('appliesTo', v as CreateDiscountRequest['appliesTo'])}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-400">Prioridad (0–100)</label>
              <Input type="number" min={0} max={100}
                value={form.priority ?? 0} onChange={e => field('priority', parseInt(e.target.value) || 0)} />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-neutral-400">Descripción</label>
            <textarea rows={2} value={form.description ?? ''}
              onChange={e => field('description', e.target.value)}
              placeholder="Descripción opcional..."
              className="w-full resize-none rounded-lg border border-neutral-700 bg-obsidian-900 px-3 py-2 text-sm text-neutral-200 placeholder-neutral-600 outline-none focus:border-gold-400" />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-400">Monto mínimo</label>
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
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-400">Cantidad mínima</label>
              <Input type="number" min={0} value={form.minQuantity ?? ''}
                onChange={e => field('minQuantity', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Opcional" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-400">Inicio</label>
              <Input type="date" value={form.startsAt ?? ''} onChange={e => field('startsAt', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-400">Vencimiento</label>
              <Input type="date" value={form.endsAt ?? ''} onChange={e => field('endsAt', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-neutral-400">Usos máximos</label>
              <Input type="number" min={1} value={form.maxUsage ?? ''}
                onChange={e => field('maxUsage', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Ilimitado" />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-300">
            <input type="checkbox" checked={form.isStackable ?? false}
              onChange={e => field('isStackable', e.target.checked)}
              className="h-4 w-4 rounded border-neutral-600 accent-gold-400" />
            Acumulable con otros descuentos
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" size="md" type="button" onClick={closeModal}>Cancelar</Button>
            <Button variant="primary" size="md" type="submit" loading={isSaving}>
              {editing ? 'Guardar cambios' : 'Crear descuento'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal eliminar ───────────────────────────────────────────────────── */}
      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Eliminar descuento" size="sm">
        <p className="mb-5 text-sm text-neutral-300">
          ¿Eliminar el descuento <span className="font-semibold text-neutral-100">{deleting?.name}</span>?
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
