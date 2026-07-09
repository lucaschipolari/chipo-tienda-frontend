import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Truck, Plus, Search, Eye, Pencil, ToggleLeft, ToggleRight,
  Phone, Mail, Globe, MapPin, CheckCircle, XCircle, Package,
  User, Star,
} from 'lucide-react'
import { Button }        from '@/components/ui/Button/Button'
import { Modal }         from '@/components/ui/Modal/Modal'
import { Badge }         from '@/components/ui/Badge/Badge'
import { StatCard }      from '@/components/data-display/StatCard/StatCard'
import { Pagination }    from '@/components/data-display/Pagination/Pagination'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog/ConfirmDialog'
import { cn }            from '@/utils/helpers/cn'
import {
  useSuppliers, useSupplier, useChangeSupplierStatus,
} from '@/features/suppliers/hooks/useSuppliers'
import type { SupplierListItem } from '@/types/supplier.types'

// ─── Status badge ─────────────────────────────────────────────────────────────

function SupplierStatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge variant={isActive ? 'success' : 'neutral'} size="sm">
      {isActive ? 'Activo' : 'Inactivo'}
    </Badge>
  )
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function SupplierRow({
  supplier, onView, onEdit, onToggleStatus,
}: {
  supplier: SupplierListItem
  onView: () => void
  onEdit: () => void
  onToggleStatus: () => void
}) {
  return (
    <tr className="border-t border-neutral-800/50 hover:bg-obsidian-800/30 transition-colors group">
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-white">{supplier.companyName}</p>
          {supplier.tradeName && (
            <p className="text-xs text-neutral-500 mt-0.5">{supplier.tradeName}</p>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        {supplier.taxId ? (
          <span className="text-sm text-neutral-300">{supplier.taxId}</span>
        ) : (
          <span className="text-neutral-700">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <div className="space-y-0.5">
          {supplier.email && (
            <p className="text-xs text-neutral-400 flex items-center gap-1">
              <Mail className="h-3 w-3" />{supplier.email}
            </p>
          )}
          {supplier.phone && (
            <p className="text-xs text-neutral-400 flex items-center gap-1">
              <Phone className="h-3 w-3" />{supplier.phone}
            </p>
          )}
          {!supplier.email && !supplier.phone && (
            <span className="text-neutral-700">—</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        {supplier.city ? (
          <p className="text-xs text-neutral-400 flex items-center gap-1">
            <MapPin className="h-3 w-3" />{supplier.city}
          </p>
        ) : (
          <span className="text-neutral-700">—</span>
        )}
      </td>
      <td className="px-4 py-3">
        <span className="text-white font-medium flex items-center gap-1 text-sm">
          <Package className="h-3.5 w-3.5 text-neutral-500" />
          {supplier.productCount}
        </span>
      </td>
      <td className="px-4 py-3">
        <SupplierStatusBadge isActive={supplier.isActive} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onView}
            className="p-1.5 rounded-lg hover:bg-obsidian-800 text-neutral-400 hover:text-white transition-colors"
            title="Ver detalle"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-obsidian-800 text-neutral-400 hover:text-white transition-colors"
            title="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={onToggleStatus}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              supplier.isActive
                ? 'hover:bg-red-500/10 text-neutral-400 hover:text-red-400'
                : 'hover:bg-emerald-500/10 text-neutral-400 hover:text-emerald-400',
            )}
            title={supplier.isActive ? 'Desactivar' : 'Activar'}
          >
            {supplier.isActive
              ? <ToggleLeft className="h-4 w-4" />
              : <ToggleRight className="h-4 w-4" />}
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─── Detail modal content ─────────────────────────────────────────────────────

function SupplierDetail({
  supplier,
}: {
  supplier: NonNullable<ReturnType<typeof useSupplier>['data']>
}) {
  return (
    <div className="space-y-5">

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-obsidian-900 rounded-xl p-4">
          <p className="text-xs text-neutral-500 mb-1">Productos asociados</p>
          <p className="text-2xl font-semibold text-white flex items-center gap-2">
            <Package className="h-5 w-5 text-neutral-500" />
            —
          </p>
        </div>
        <div className="bg-obsidian-900 rounded-xl p-4">
          <p className="text-xs text-neutral-500 mb-1">Estado</p>
          <div className="mt-1">
            <SupplierStatusBadge isActive={supplier.isActive} />
          </div>
        </div>
      </div>

      {/* Company info */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-neutral-300">Información de la empresa</h3>
        <div className="bg-obsidian-900 rounded-xl p-4 space-y-2">
          {supplier.taxId && (
            <p className="text-sm text-neutral-300 flex gap-2">
              <span className="text-neutral-500 text-xs font-medium uppercase mt-0.5">CUIT/Tax ID</span>
              {supplier.taxId}
            </p>
          )}
          {supplier.email && (
            <p className="text-sm text-neutral-300 flex gap-2 items-center">
              <Mail className="h-4 w-4 text-neutral-500 shrink-0" />
              {supplier.email}
            </p>
          )}
          {supplier.phone && (
            <p className="text-sm text-neutral-300 flex gap-2 items-center">
              <Phone className="h-4 w-4 text-neutral-500 shrink-0" />
              {supplier.phone}
            </p>
          )}
          {supplier.website && (
            <p className="text-sm text-neutral-300 flex gap-2 items-center">
              <Globe className="h-4 w-4 text-neutral-500 shrink-0" />
              <a
                href={supplier.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold-400 hover:underline truncate"
              >
                {supplier.website}
              </a>
            </p>
          )}
          {(supplier.city || supplier.province || supplier.country) && (
            <p className="text-sm text-neutral-300 flex gap-2 items-center">
              <MapPin className="h-4 w-4 text-neutral-500 shrink-0" />
              {[supplier.city, supplier.province, supplier.country].filter(Boolean).join(', ')}
            </p>
          )}
          {supplier.paymentTerms && (
            <p className="text-sm text-neutral-300 flex gap-2">
              <span className="text-neutral-500 text-xs font-medium uppercase mt-0.5 shrink-0">
                Términos de pago
              </span>
              {supplier.paymentTerms}
            </p>
          )}
        </div>
      </div>

      {/* Contacts */}
      {supplier.contacts && supplier.contacts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-neutral-300">Contactos</h3>
          <div className="space-y-2">
            {supplier.contacts.map(contact => (
              <div
                key={contact.id}
                className="bg-obsidian-900 rounded-xl p-4 flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-obsidian-800 flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-neutral-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white flex items-center gap-1.5">
                      {contact.name}
                      {contact.isPrimary && (
                        <Star className="h-3 w-3 text-gold-400 fill-gold-400" />
                      )}
                    </p>
                    {contact.jobTitle && (
                      <p className="text-xs text-neutral-500">{contact.jobTitle}</p>
                    )}
                    <div className="mt-1 space-y-0.5">
                      {contact.email && (
                        <p className="text-xs text-neutral-400 flex items-center gap-1">
                          <Mail className="h-3 w-3" />{contact.email}
                        </p>
                      )}
                      {contact.phone && (
                        <p className="text-xs text-neutral-400 flex items-center gap-1">
                          <Phone className="h-3 w-3" />{contact.phone}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                {contact.isPrimary && (
                  <Badge variant="warning" size="sm">Principal</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {supplier.notes && (
        <div className="bg-obsidian-900 rounded-xl p-4">
          <p className="text-xs text-neutral-500 mb-1">Notas</p>
          <p className="text-sm text-neutral-300">{supplier.notes}</p>
        </div>
      )}

      <p className="text-xs text-neutral-600">
        Registrado el{' '}
        {new Date(supplier.createdAt).toLocaleDateString('es-AR', {
          day: '2-digit', month: 'short', year: 'numeric',
        })}
      </p>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SuppliersPage() {
  const navigate = useNavigate()

  const [page, setPage]             = useState(1)
  const [search, setSearch]         = useState('')
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined)
  const [detailId, setDetailId]     = useState<string | null>(null)
  const [statusConfirm, setStatusConfirm] = useState<
    { id: string; name: string; current: boolean } | null
  >(null)

  const { data, isLoading } = useSuppliers({
    page,
    pageSize: 20,
    search: search || undefined,
    isActive: filterActive,
  })
  const { data: detail }  = useSupplier(detailId ?? undefined)
  const statusMutation    = useChangeSupplierStatus()

  const totalActive   = data?.items.filter(s => s.isActive).length  ?? 0
  const totalInactive = data?.items.filter(s => !s.isActive).length ?? 0

  return (
    <div className="p-6 space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Proveedores</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Gestión de proveedores y contactos</p>
        </div>
        <Button
          onClick={() => navigate('/admin/suppliers/new')}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Nuevo proveedor
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Total proveedores"
          value={data?.totalCount ?? 0}
          icon={<Truck className="h-5 w-5" />}
        />
        <StatCard
          label="Activos"
          value={totalActive}
          icon={<CheckCircle className="h-5 w-5 text-emerald-400" />}
          variant="success"
        />
        <StatCard
          label="Inactivos"
          value={totalInactive}
          icon={<XCircle className="h-5 w-5 text-red-400" />}
          variant="danger"
        />
      </div>

      {/* ── Filtros ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar por razón social, CUIT, email o teléfono…"
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
              <th className="text-left px-4 py-3 text-neutral-500 font-medium">Razón Social</th>
              <th className="text-left px-4 py-3 text-neutral-500 font-medium">CUIT / Tax ID</th>
              <th className="text-left px-4 py-3 text-neutral-500 font-medium">Contacto</th>
              <th className="text-left px-4 py-3 text-neutral-500 font-medium">Ciudad</th>
              <th className="text-right px-4 py-3 text-neutral-500 font-medium">Productos</th>
              <th className="text-left px-4 py-3 text-neutral-500 font-medium">Estado</th>
              <th className="text-right px-4 py-3 text-neutral-500 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-t border-neutral-800/50">
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-neutral-800 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data?.items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-neutral-600">
                  No se encontraron proveedores
                </td>
              </tr>
            ) : (
              data?.items.map(supplier => (
                <SupplierRow
                  key={supplier.id}
                  supplier={supplier}
                  onView={() => setDetailId(supplier.id)}
                  onEdit={() => navigate(`/admin/suppliers/${supplier.id}/edit`)}
                  onToggleStatus={() => setStatusConfirm({
                    id: supplier.id,
                    name: supplier.companyName,
                    current: supplier.isActive,
                  })}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalCount > 20 && (
        <Pagination page={page} pageSize={20} total={data.totalCount} onPageChange={setPage} />
      )}

      {/* ── Modal detalle ── */}
      {detailId && detail && (
        <Modal
          open={!!detailId}
          onClose={() => setDetailId(null)}
          title={`Proveedor: ${detail.companyName}`}
          size="lg"
        >
          <SupplierDetail supplier={detail} />
        </Modal>
      )}

      {/* ── Confirmar cambio de estado ── */}
      {statusConfirm && (
        <ConfirmDialog
          open={!!statusConfirm}
          title={statusConfirm.current ? 'Desactivar proveedor' : 'Activar proveedor'}
          description={`¿Estás seguro de ${statusConfirm.current ? 'desactivar' : 'activar'} al proveedor "${statusConfirm.name}"?`}
          confirmLabel={statusConfirm.current ? 'Desactivar' : 'Activar'}
          variant={statusConfirm.current ? 'danger' : 'default'}
          onConfirm={() => {
            statusMutation.mutate({
              id: statusConfirm.id,
              isActive: !statusConfirm.current,
            })
            setStatusConfirm(null)
          }}
          onCancel={() => setStatusConfirm(null)}
        />
      )}
    </div>
  )
}
