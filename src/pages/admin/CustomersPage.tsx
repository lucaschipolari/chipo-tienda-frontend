import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Users, Plus, Search, Eye, Pencil, ToggleLeft, ToggleRight,
  Phone, Mail, FileText, TrendingUp, ShoppingBag, CheckCircle, XCircle,
  MapPin,
} from 'lucide-react'
import { Button }        from '@/components/ui/Button/Button'
import { Modal }         from '@/components/ui/Modal/Modal'
import { Badge }         from '@/components/ui/Badge/Badge'
import { Input }         from '@/components/ui/Input/Input'
import { Select }        from '@/components/ui/Select/Select'
import { Textarea }      from '@/components/ui/Textarea/Textarea'
import { StatCard }      from '@/components/data-display/StatCard/StatCard'
import { Pagination }    from '@/components/data-display/Pagination/Pagination'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog'
import { cn }            from '@/utils/helpers/cn'
import {
  useCustomers, useCustomer, useUpdateCustomer, useChangeCustomerStatus,
} from '@/features/customers/hooks/useCustomers'
import type {
  CustomerListItem, CustomerType, DocumentType, UpdateCustomerRequest,
} from '@/types/customer.types'
import { formatMoney } from '@/utils/helpers/formatMoney'

// ─── Opciones ─────────────────────────────────────────────────────────────────

const DOC_TYPE_OPTIONS = [
  { value: 'DNI',       label: 'DNI' },
  { value: 'RUC',       label: 'RUC' },
  { value: 'CE',        label: 'CE' },
  { value: 'Pasaporte', label: 'Pasaporte' },
]
const CUSTOMER_TYPE_OPTIONS = [
  { value: 'Retail',    label: 'Minorista' },
  { value: 'Wholesale', label: 'Mayorista' },
]

const TYPE_LABELS: Record<CustomerType, string> = {
  Retail: 'Minorista', Wholesale: 'Mayorista',
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function CustomerStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? 'success' : 'neutral'} size="sm">
      {isActive ? 'Activo' : 'Inactivo'}
    </Badge>
  )
}
function CustomerTypeBadge({ type }: { type: CustomerType }) {
  return (
    <Badge variant={type === 'Wholesale' ? 'warning' : 'default'} size="sm">
      {TYPE_LABELS[type]}
    </Badge>
  )
}

// ─── Edit form ────────────────────────────────────────────────────────────────

interface EditFormState {
  firstName:      string
  lastName:       string
  documentType:   DocumentType
  documentNumber: string
  email:          string
  phoneNumber:    string
  customerType:   CustomerType
  street:         string
  city:           string
  province:       string
  postalCode:     string
  notes:          string
}

function EditCustomerForm({
  initial, customerId, onClose,
}: {
  initial: EditFormState
  customerId: string
  onClose: () => void
}) {
  const updateMutation = useUpdateCustomer()
  const [form, setForm] = useState<EditFormState>(initial)
  const [errs, setErrs] = useState<Partial<Record<keyof EditFormState, string>>>({})

  const set = (k: keyof EditFormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm(f => ({ ...f, [k]: e.target.value }))
    setErrs(er => ({ ...er, [k]: undefined }))
  }

  function validate() {
    const e: Partial<Record<keyof EditFormState, string>> = {}
    if (!form.firstName.trim())      e.firstName      = 'Requerido'
    if (!form.lastName.trim())       e.lastName       = 'Requerido'
    if (!form.documentNumber.trim()) e.documentNumber = 'Requerido'
    setErrs(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return
    const req: UpdateCustomerRequest = {
      id:             customerId,
      firstName:      form.firstName.trim(),
      lastName:       form.lastName.trim(),
      documentNumber: form.documentNumber.trim(),
      documentType:   form.documentType,
      email:          form.email.trim()     || undefined,
      phoneNumber:    form.phoneNumber.trim() || undefined,
      customerType:   form.customerType,
      street:         form.street.trim()    || undefined,
      city:           form.city.trim()      || undefined,
      province:       form.province.trim()  || undefined,
      postalCode:     form.postalCode.trim() || undefined,
      notes:          form.notes.trim()     || undefined,
    }
    updateMutation.mutate(
      { id: customerId, data: req },
      {
        onSuccess: () => {
          toast.success('Cliente actualizado correctamente.')
          onClose()
        },
        onError: (err: any) => {
          const msg = err?.response?.data?.detail || err?.message || 'Error al actualizar.'
          toast.error(msg)
        },
      }
    )
  }

  const lbl = (t: string, req = false) => (
    <label className="block text-xs font-medium text-neutral-400 mb-1">
      {t}{req && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>{lbl('Nombre', true)}<Input value={form.firstName} onChange={set('firstName')} error={errs.firstName} fullWidth /></div>
        <div>{lbl('Apellido', true)}<Input value={form.lastName} onChange={set('lastName')} error={errs.lastName} fullWidth /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          {lbl('Tipo de doc.', true)}
          <Select value={form.documentType} onChange={set('documentType')} options={DOC_TYPE_OPTIONS} fullWidth />
        </div>
        <div>{lbl('N° documento', true)}<Input value={form.documentNumber} onChange={set('documentNumber')} error={errs.documentNumber} fullWidth /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>{lbl('Email')}<Input type="email" value={form.email} onChange={set('email')} fullWidth /></div>
        <div>{lbl('Teléfono')}<Input value={form.phoneNumber} onChange={set('phoneNumber')} fullWidth /></div>
      </div>
      <div>{lbl('Tipo de cliente')}
        <Select value={form.customerType} onChange={set('customerType')} options={CUSTOMER_TYPE_OPTIONS} fullWidth />
      </div>
      <div className="border-t border-neutral-800 pt-3 space-y-3">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Dirección</p>
        <Input placeholder="Calle / Av." value={form.street} onChange={set('street')} fullWidth />
        <div className="grid grid-cols-3 gap-2">
          <Input placeholder="Ciudad" value={form.city} onChange={set('city')} fullWidth />
          <Input placeholder="Provincia" value={form.province} onChange={set('province')} fullWidth />
          <Input placeholder="C.P." value={form.postalCode} onChange={set('postalCode')} fullWidth />
        </div>
      </div>
      <div>
        {lbl('Notas')}
        <Textarea value={form.notes} onChange={set('notes')} rows={2} fullWidth />
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
        <Button type="submit" isLoading={updateMutation.isPending}>Guardar cambios</Button>
      </div>
    </form>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const navigate = useNavigate()

  const [page, setPage]               = useState(1)
  const [search, setSearch]           = useState('')
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined)
  const [editId, setEditId]           = useState<string | null>(null)
  const [detailId, setDetailId]       = useState<string | null>(null)
  const [statusConfirm, setStatusConfirm] = useState<
    { id: string; name: string; current: boolean } | null
  >(null)

  const { data, isLoading }  = useCustomers({ page, pageSize: 20, search: search || undefined, isActive: filterActive })
  const { data: detail }     = useCustomer(editId ?? detailId ?? undefined)
  const statusMutation       = useChangeCustomerStatus()

  const totalActive    = data?.items.filter(c => c.isActive).length  ?? 0
  const totalInactive  = data?.items.filter(c => !c.isActive).length ?? 0
  const totalWholesale = data?.items.filter(c => c.customerType === 'Wholesale').length ?? 0

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Clientes</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Registro y gestión de clientes</p>
        </div>
        <Button
          onClick={() => navigate('/admin/customers/new')}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Nuevo cliente
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total clientes"   value={data?.totalCount ?? 0}  icon={<Users className="h-5 w-5" />} />
        <StatCard label="Activos"          value={totalActive}             icon={<CheckCircle className="h-5 w-5 text-emerald-400" />} variant="success" />
        <StatCard label="Inactivos"        value={totalInactive}           icon={<XCircle className="h-5 w-5 text-red-400" />} variant="danger" />
        <StatCard label="Mayoristas"       value={totalWholesale}          icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar por nombre, email, teléfono o documento…"
            className="w-full pl-9 pr-4 py-2 bg-obsidian-900 border border-neutral-800 rounded-xl text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-gold-500"
          />
        </div>
        <select
          value={filterActive === undefined ? '' : filterActive ? 'true' : 'false'}
          onChange={e => {
            setFilterActive(e.target.value === '' ? undefined : e.target.value === 'true')
            setPage(1)
          }}
          className="bg-obsidian-900 border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-gold-500"
        >
          <option value="">Todos los estados</option>
          <option value="true">Solo activos</option>
          <option value="false">Solo inactivos</option>
        </select>
      </div>

      {/* ── Tabla ── */}
      <div className="rounded-2xl border border-neutral-800 overflow-hidden" style={{ background: 'var(--surface)' }}>
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-800">
            <tr>
              <th className="text-left px-4 py-3 text-neutral-500 font-medium">Cliente</th>
              <th className="text-left px-4 py-3 text-neutral-500 font-medium">Contacto</th>
              <th className="text-left px-4 py-3 text-neutral-500 font-medium">Ciudad</th>
              <th className="text-left px-4 py-3 text-neutral-500 font-medium">Tipo</th>
              <th className="text-right px-4 py-3 text-neutral-500 font-medium">Pedidos</th>
              <th className="text-right px-4 py-3 text-neutral-500 font-medium">Total</th>
              <th className="text-left px-4 py-3 text-neutral-500 font-medium">Estado</th>
              <th className="text-right px-4 py-3 text-neutral-500 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-t border-neutral-800/50">
                  {[...Array(8)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-neutral-800 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-neutral-600">
                  No se encontraron clientes
                </td>
              </tr>
            ) : (
              data?.items.map(customer => (
                <CustomerRow
                  key={customer.id}
                  customer={customer}
                  onView={()         => setDetailId(customer.id)}
                  onEdit={()         => setEditId(customer.id)}
                  onToggleStatus={() => setStatusConfirm({
                    id: customer.id, name: customer.fullName, current: customer.isActive,
                  })}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalCount > 20 && (
        <Pagination page={page} totalPages={Math.ceil(data.totalCount / 20)} onPageChange={setPage} />
      )}

      {/* ── Modal editar ── */}
      {editId && detail && (
        <Modal isOpen={!!editId} onClose={() => setEditId(null)} title="Editar cliente" size="lg">
          <EditCustomerForm
            customerId={editId}
            initial={{
              firstName:      detail.firstName,
              lastName:       detail.lastName,
              documentType:   detail.documentType,
              documentNumber: detail.documentNumber,
              email:          detail.email       ?? '',
              phoneNumber:    detail.phoneNumber ?? '',
              customerType:   detail.customerType,
              street:         detail.street      ?? '',
              city:           detail.city        ?? '',
              province:       detail.province    ?? '',
              postalCode:     detail.postalCode  ?? '',
              notes:          detail.notes       ?? '',
            }}
            onClose={() => setEditId(null)}
          />
        </Modal>
      )}

      {/* ── Modal detalle ── */}
      {detailId && detail && (
        <Modal isOpen={!!detailId} onClose={() => setDetailId(null)} title={`Cliente: ${detail.fullName}`} size="lg">
          <CustomerDetail customer={detail} />
        </Modal>
      )}

      {/* ── Confirmar cambio de estado ── */}
      {statusConfirm && (
        <ConfirmDialog
          isOpen={!!statusConfirm}
          title={statusConfirm.current ? 'Desactivar cliente' : 'Activar cliente'}
          description={`¿Estás seguro de ${statusConfirm.current ? 'desactivar' : 'activar'} al cliente "${statusConfirm.name}"?`}
          confirmLabel={statusConfirm.current ? 'Desactivar' : 'Activar'}
          danger={statusConfirm.current}
          onConfirm={() => {
            statusMutation.mutate(
              { id: statusConfirm.id, isActive: !statusConfirm.current },
              {
                onSuccess: () =>
                  toast.success(`Cliente ${statusConfirm.current ? 'desactivado' : 'activado'} correctamente.`),
                onError: () => toast.error('Error al cambiar el estado del cliente.'),
              }
            )
            setStatusConfirm(null)
          }}
          onClose={() => setStatusConfirm(null)}
        />
      )}
    </div>
  )
}

// ─── Row ─────────────────────────────────────────────────────────────────────

function CustomerRow({
  customer, onView, onEdit, onToggleStatus,
}: {
  customer: CustomerListItem
  onView: () => void
  onEdit: () => void
  onToggleStatus: () => void
}) {
  return (
    <tr className="border-t border-neutral-800/50 hover:bg-obsidian-800/30 transition-colors group">
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-white">{customer.fullName}</p>
          <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
            <FileText className="h-3 w-3" />
            {customer.documentType} {customer.documentNumber}
          </p>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="space-y-0.5">
          {customer.email && (
            <p className="text-xs text-neutral-400 flex items-center gap-1">
              <Mail className="h-3 w-3" />{customer.email}
            </p>
          )}
          {customer.phoneNumber && (
            <p className="text-xs text-neutral-400 flex items-center gap-1">
              <Phone className="h-3 w-3" />{customer.phoneNumber}
            </p>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        {customer.city ? (
          <p className="text-xs text-neutral-400 flex items-center gap-1">
            <MapPin className="h-3 w-3" />{customer.city}
          </p>
        ) : (
          <span className="text-neutral-700">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <CustomerTypeBadge type={customer.customerType} />
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-white font-medium flex items-center justify-end gap-1">
          <ShoppingBag className="h-3.5 w-3.5 text-neutral-500" />
          {customer.totalOrders}
        </span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-gold-400 font-medium">
          {customer.currency} {formatMoney(customer.totalSpent)}
        </span>
      </td>
      <td className="px-4 py-3">
        <CustomerStatusBadge isActive={customer.isActive} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onView} className="p-1.5 rounded-lg hover:bg-obsidian-800 text-neutral-400 hover:text-white transition-colors" title="Ver detalle">
            <Eye className="h-4 w-4" />
          </button>
          <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-obsidian-800 text-neutral-400 hover:text-white transition-colors" title="Editar">
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={onToggleStatus}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              customer.isActive
                ? 'hover:bg-red-500/10 text-neutral-400 hover:text-red-400'
                : 'hover:bg-emerald-500/10 text-neutral-400 hover:text-emerald-400',
            )}
            title={customer.isActive ? 'Desactivar' : 'Activar'}
          >
            {customer.isActive ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Detail ───────────────────────────────────────────────────────────────────

function CustomerDetail({ customer }: { customer: NonNullable<ReturnType<typeof useCustomer>['data']> }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-obsidian-900 rounded-xl p-4">
          <p className="text-xs text-neutral-500 mb-1">Total pedidos</p>
          <p className="text-2xl font-semibold text-white">{customer.totalOrders}</p>
        </div>
        <div className="bg-obsidian-900 rounded-xl p-4">
          <p className="text-xs text-neutral-500 mb-1">Total gastado</p>
          <p className="text-2xl font-semibold text-gold-400">
            {customer.currency} {formatMoney(customer.totalSpent)}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-neutral-300">Información</h3>
        <div className="bg-obsidian-900 rounded-xl p-4 space-y-2">
          <p className="text-sm text-neutral-300 flex gap-2">
            <FileText className="h-4 w-4 text-neutral-500 shrink-0" />
            {customer.documentType} — {customer.documentNumber}
          </p>
          {customer.email && (
            <p className="text-sm text-neutral-300 flex gap-2">
              <Mail className="h-4 w-4 text-neutral-500 shrink-0" />{customer.email}
            </p>
          )}
          {customer.phoneNumber && (
            <p className="text-sm text-neutral-300 flex gap-2">
              <Phone className="h-4 w-4 text-neutral-500 shrink-0" />{customer.phoneNumber}
            </p>
          )}
          {customer.city && (
            <p className="text-sm text-neutral-300 flex gap-2">
              <MapPin className="h-4 w-4 text-neutral-500 shrink-0" />
              {[customer.street, customer.city, customer.province].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </div>

      {customer.addresses.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-neutral-300">Direcciones adicionales</h3>
          {customer.addresses.map(addr => (
            <div key={addr.id} className="bg-obsidian-900 rounded-xl p-4 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-white">{addr.label}</p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {addr.street}, {addr.city}{addr.state ? `, ${addr.state}` : ''}
                </p>
              </div>
              {addr.isDefault && <Badge variant="success" size="sm">Principal</Badge>}
            </div>
          ))}
        </div>
      )}

      {customer.notes && (
        <div className="bg-obsidian-900 rounded-xl p-4">
          <p className="text-xs text-neutral-500 mb-1">Notas</p>
          <p className="text-sm text-neutral-300">{customer.notes}</p>
        </div>
      )}

      {customer.lastOrderAt && (
        <p className="text-xs text-neutral-600">
          Último pedido:{' '}
          {new Date(customer.lastOrderAt).toLocaleDateString('es-AR', {
            day: '2-digit', month: 'short', year: 'numeric',
          })}
        </p>
      )}
    </div>
  )
}
