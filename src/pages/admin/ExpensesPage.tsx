import { useState } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  Plus, Pencil, Check, X, Eye, Tag, Calendar,
} from 'lucide-react'
import { Button }     from '@/components/ui/Button/Button'
import { Modal }      from '@/components/ui/Modal/Modal'
import { Badge }      from '@/components/ui/Badge/Badge'
import { Input }      from '@/components/ui/Input/Input'
import { Select }     from '@/components/ui/Select/Select'
import { StatCard }   from '@/components/data-display/StatCard/StatCard'
import { Pagination } from '@/components/data-display/Pagination/Pagination'
import {
  useExpenses,
  useExpenseCategories,
  useExpenseDashboard,
  useCreateExpense,
  useUpdateExpense,
  useChangeExpenseStatus,
  useCreateCategory,
  useUpdateCategory,
  useToggleCategoryStatus,
} from '@/features/expenses/hooks/useExpenses'
import type {
  ExpenseListItem,
  ExpenseStatus,
  ExpenseCategory,
} from '@/types/expense.types'
import { formatMoney } from '@/utils/helpers/formatMoney'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'Pending', label: 'Pendiente' },
  { value: 'Paid', label: 'Pagado' },
  { value: 'Cancelled', label: 'Cancelado' },
]

const CURRENCY_OPTIONS = [
  { value: 'ARS', label: 'ARS' },
]

const PRESET_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280',
]

function statusVariant(status: ExpenseStatus): 'warning' | 'success' | 'error' | 'neutral' {
  if (status === 'Pending')   return 'warning'
  if (status === 'Paid')      return 'success'
  if (status === 'Cancelled') return 'error'
  return 'neutral'
}

function statusLabel(status: ExpenseStatus): string {
  if (status === 'Pending')   return 'Pendiente'
  if (status === 'Paid')      return 'Pagado'
  if (status === 'Cancelled') return 'Cancelado'
  return status
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

// ─── Expense Form Modal ───────────────────────────────────────────────────────

interface ExpenseFormModalProps {
  open: boolean
  onClose: () => void
  editing?: ExpenseListItem | null
}

function ExpenseFormModal({ open, onClose, editing }: ExpenseFormModalProps) {
  const { data: categories = [] } = useExpenseCategories(true)
  const createMutation = useCreateExpense()
  const updateMutation = useUpdateExpense()

  const [form, setForm] = useState({
    categoryId:   editing?.categoryId   ?? '',
    date:         editing?.date?.slice(0,10) ?? today(),
    amount:       editing?.amount?.toString() ?? '',
    currency:     editing?.currency     ?? 'ARS',
    description:  editing?.description  ?? '',
    observations: '',
    receiptUrl:   '',
  })

  const isLoading = createMutation.isPending || updateMutation.isPending

  function handleChange(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      categoryId:   form.categoryId,
      date:         form.date,
      amount:       parseFloat(form.amount),
      currency:     form.currency,
      description:  form.description,
      observations: form.observations || undefined,
    }
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, data: { id: editing.id, ...payload } })
    } else {
      await createMutation.mutateAsync(payload)
    }
    onClose()
  }

  const catOptions = categories.map(c => ({ value: c.id, label: c.name }))

  return (
    <Modal isOpen={open} onClose={onClose} title={editing ? 'Editar gasto' : 'Nuevo gasto'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs text-neutral-400 mb-1">Categoría *</label>
            <Select
              options={catOptions}
              value={form.categoryId}
              onChange={e => handleChange('categoryId', (e as React.ChangeEvent<HTMLSelectElement>).target.value)}
              placeholder="Seleccionar categoría"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Fecha *</label>
            <Input
              type="date"
              value={form.date}
              onChange={e => handleChange('date', e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Moneda</label>
            <Select
              options={CURRENCY_OPTIONS}
              value={form.currency}
              onChange={e => handleChange('currency', (e as React.ChangeEvent<HTMLSelectElement>).target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-neutral-400 mb-1">Monto *</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={e => handleChange('amount', e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-neutral-400 mb-1">Descripción *</label>
            <Input
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="Descripción del gasto"
              required
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-neutral-400 mb-1">Observaciones</label>
            <textarea
              className="w-full bg-obsidian-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-gold-400 resize-none"
              rows={3}
              value={form.observations}
              onChange={e => handleChange('observations', e.target.value)}
              placeholder="Notas adicionales (opcional)"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-neutral-400 mb-1">URL del comprobante</label>
            <Input
              value={form.receiptUrl}
              onChange={e => handleChange('receiptUrl', e.target.value)}
              placeholder="https://... (opcional)"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
          <Button type="submit" loading={isLoading}>
            {editing ? 'Guardar cambios' : 'Registrar gasto'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// ─── Categories Modal ─────────────────────────────────────────────────────────

interface CategoriesModalProps {
  open: boolean
  onClose: () => void
}

function CategoriesModal({ open, onClose }: CategoriesModalProps) {
  const { data: categories = [], isLoading } = useExpenseCategories()
  const createMutation  = useCreateCategory()
  const toggleMutation  = useToggleCategoryStatus()

  const [newForm, setNewForm] = useState({ name: '', description: '', color: '#3B82F6' })
  const [adding, setAdding]   = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    await createMutation.mutateAsync(newForm)
    setNewForm({ name: '', description: '', color: '#3B82F6' })
    setAdding(false)
  }

  return (
    <Modal isOpen={open} onClose={onClose} title="Gestionar categorías" size="lg">
      <div className="space-y-4">
        {isLoading && <p className="text-neutral-500 text-sm">Cargando...</p>}

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {categories.map(cat => (
            <div key={cat.id} className="flex items-center gap-3 bg-obsidian-900 rounded-lg px-3 py-2">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{cat.name}</p>
                {cat.description && <p className="text-xs text-neutral-500 truncate">{cat.description}</p>}
              </div>
              <span className="text-xs text-neutral-500">{cat.expenseCount} gastos</span>
              <button
                onClick={() => toggleMutation.mutate({ id: cat.id, isActive: !cat.isActive })}
                className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                  cat.isActive
                    ? 'border-green-600 text-green-400'
                    : 'border-neutral-600 text-neutral-500'
                }`}
              >
                {cat.isActive ? 'Activo' : 'Inactivo'}
              </button>
            </div>
          ))}
        </div>

        {adding ? (
          <form onSubmit={handleCreate} className="bg-obsidian-900 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium text-white">Nueva categoría</p>
            <Input
              placeholder="Nombre *"
              value={newForm.name}
              onChange={e => setNewForm(f => ({ ...f, name: e.target.value }))}
              required
            />
            <Input
              placeholder="Descripción (opcional)"
              value={newForm.description}
              onChange={e => setNewForm(f => ({ ...f, description: e.target.value }))}
            />
            <div>
              <label className="block text-xs text-neutral-400 mb-1">Color</label>
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map(c => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setNewForm(f => ({ ...f, color: c }))}
                    className="w-6 h-6 rounded-full border-2 transition-transform"
                    style={{
                      background: c,
                      borderColor: newForm.color === c ? '#fff' : 'transparent',
                      transform: newForm.color === c ? 'scale(1.2)' : 'scale(1)',
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" type="button" size="sm" onClick={() => setAdding(false)}>Cancelar</Button>
              <Button type="submit" size="sm" loading={createMutation.isPending}>Crear</Button>
            </div>
          </form>
        ) : (
          <Button variant="secondary" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={() => setAdding(true)}>
            Añadir categoría
          </Button>
        )}
      </div>
    </Modal>
  )
}

// ─── Expenses Table Tab ───────────────────────────────────────────────────────

function ExpensesListTab() {
  const [page, setPage]             = useState(1)
  const [search, setSearch]         = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [status, setStatus]         = useState('')
  const [from, setFrom]             = useState('')
  const [to, setTo]                 = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [catsOpen, setCatsOpen]     = useState(false)
  const [editing, setEditing]       = useState<ExpenseListItem | null>(null)
  const [confirming, setConfirming] = useState<{ id: string; action: 'Paid' | 'Cancelled' } | null>(null)

  const { data: categories = [] } = useExpenseCategories()
  const changeStatus = useChangeExpenseStatus()

  const params = {
    page,
    pageSize: 15,
    search:     search     || undefined,
    categoryId: categoryId || undefined,
    status:     (status as ExpenseStatus) || undefined,
    from:       from       || undefined,
    to:         to         || undefined,
  }

  const { data, isLoading } = useExpenses(params)
  const expenses   = data?.items   ?? []
  const totalPages = data?.totalPages ?? 1

  function clearFilters() {
    setSearch(''); setCategoryId(''); setStatus(''); setFrom(''); setTo(''); setPage(1)
  }

  const catOptions = [
    { value: '', label: 'Todas las categorías' },
    ...categories.map(c => ({ value: c.id, label: c.name })),
  ]

  async function confirmAction() {
    if (!confirming) return
    await changeStatus.mutateAsync({ id: confirming.id, newStatus: confirming.action })
    setConfirming(null)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Gastos</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Tag className="h-4 w-4" />}
            onClick={() => setCatsOpen(true)}
          >
            Gestionar categorías
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => { setEditing(null); setCreateOpen(true) }}
          >
            Nuevo gasto
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-obsidian-800 rounded-xl p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs text-neutral-400 mb-1">Buscar</label>
          <Input
            placeholder="Descripción..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <div className="min-w-[160px]">
          <label className="block text-xs text-neutral-400 mb-1">Categoría</label>
          <Select options={catOptions} value={categoryId} onChange={v => { setCategoryId(v as string); setPage(1) }} />
        </div>
        <div className="min-w-[130px]">
          <label className="block text-xs text-neutral-400 mb-1">Estado</label>
          <Select options={STATUS_OPTIONS} value={status} onChange={v => { setStatus(v as string); setPage(1) }} />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Desde</label>
          <Input type="date" value={from} onChange={e => { setFrom(e.target.value); setPage(1) }} />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Hasta</label>
          <Input type="date" value={to} onChange={e => { setTo(e.target.value); setPage(1) }} />
        </div>
        <Button variant="ghost" size="sm" onClick={clearFilters}>Limpiar</Button>
      </div>

      {/* Table */}
      <div className="bg-obsidian-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-700">
              {['Fecha', 'Categoría', 'Descripción', 'Monto', 'Estado', 'Acciones'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs text-neutral-400 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-neutral-500">Cargando...</td>
              </tr>
            )}
            {!isLoading && expenses.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-neutral-500">Sin gastos registrados</td>
              </tr>
            )}
            {expenses.map(exp => (
              <tr key={exp.id} className="border-b border-neutral-800 hover:bg-obsidian-900 transition-colors">
                <td className="px-4 py-3 text-neutral-300">
                  {new Date(exp.date).toLocaleDateString('es-AR')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: exp.categoryColor }} />
                    <span className="text-white">{exp.categoryName}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-300 max-w-xs truncate">{exp.description}</td>
                <td className="px-4 py-3 font-mono text-gold-400">
                  {exp.currency} {formatMoney(exp.amount)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant(exp.status)}>{statusLabel(exp.status)}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {exp.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => { setEditing(exp); setCreateOpen(true) }}
                          className="p-1.5 rounded hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirming({ id: exp.id, action: 'Paid' })}
                          className="p-1.5 rounded hover:bg-green-900 text-neutral-400 hover:text-green-400 transition-colors"
                          title="Marcar como pagado"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirming({ id: exp.id, action: 'Cancelled' })}
                          className="p-1.5 rounded hover:bg-red-900 text-neutral-400 hover:text-red-400 transition-colors"
                          title="Cancelar"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
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

      {/* Modals */}
      {(createOpen || editing) && (
        <ExpenseFormModal
          open={createOpen}
          onClose={() => { setCreateOpen(false); setEditing(null) }}
          editing={editing}
        />
      )}

      <CategoriesModal open={catsOpen} onClose={() => setCatsOpen(false)} />

      {/* Confirm status change */}
      <Modal
        isOpen={!!confirming}
        onClose={() => setConfirming(null)}
        title={confirming?.action === 'Paid' ? 'Marcar como pagado' : 'Cancelar gasto'}
        size="sm"
      >
        <p className="text-neutral-300 mb-5">
          {confirming?.action === 'Paid'
            ? '¿Confirmas que este gasto ha sido pagado?'
            : '¿Estás seguro de que deseas cancelar este gasto?'}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirming(null)}>No</Button>
          <Button
            variant={confirming?.action === 'Paid' ? 'primary' : 'danger'}
            loading={changeStatus.isPending}
            onClick={confirmAction}
          >
            Confirmar
          </Button>
        </div>
      </Modal>
    </div>
  )
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function ExpensesDashboardTab() {
  const [from, setFrom] = useState('')
  const [to, setTo]     = useState('')
  const { data, isLoading } = useExpenseDashboard(from || undefined, to || undefined)

  const byCategory   = data?.byCategory   ?? []
  const monthlyTrend = data?.monthlyTrend ?? []

  return (
    <div className="space-y-6">
      {/* Date filters */}
      <div className="flex items-end gap-3">
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Desde</label>
          <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Hasta</label>
          <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
        </div>
        {(from || to) && (
          <Button variant="ghost" size="sm" onClick={() => { setFrom(''); setTo('') }}>Limpiar</Button>
        )}
      </div>

      {isLoading && <p className="text-neutral-500 text-sm py-10 text-center">Cargando...</p>}

      {!isLoading && data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Gastos Hoy"      value={`ARS ${formatMoney(data.todayTotal)}`}  />
            <StatCard label="Esta Semana"      value={`ARS ${formatMoney(data.weekTotal)}`}   />
            <StatCard label="Este Mes"         value={`ARS ${formatMoney(data.monthTotal)}`}  />
            <StatCard label="Este Año"         value={`ARS ${formatMoney(data.yearTotal)}`}   />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie chart */}
            <div className="bg-obsidian-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Gastos por categoría</h3>
              {byCategory.length === 0 ? (
                <p className="text-neutral-500 text-sm text-center py-10">Sin datos</p>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={byCategory}
                        dataKey="total"
                        nameKey="categoryName"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ categoryName, percentage }) =>
                          `${categoryName} ${percentage.toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {byCategory.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [`ARS ${formatMoney(value)}`, 'Total']}
                        contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: 8 }}
                        labelStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-3 space-y-1.5">
                    {byCategory.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                          <span className="text-neutral-300">{item.categoryName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-neutral-500">{item.percentage.toFixed(1)}%</span>
                          <span className="text-gold-400 font-mono">ARS {formatMoney(item.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Bar chart — monthly trend */}
            <div className="bg-obsidian-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Tendencia mensual</h3>
              {monthlyTrend.length === 0 ? (
                <p className="text-neutral-500 text-sm text-center py-10">Sin datos</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={monthlyTrend} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <Tooltip
                      formatter={(v: number) => [`ARS ${formatMoney(v)}`, 'Total']}
                      contentStyle={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: 8 }}
                    />
                    <Bar dataKey="total" fill="#EAB308" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'list' | 'dashboard'

export default function ExpensesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('list')

  return (
    <div className="p-6 space-y-6 min-h-screen">
      {/* Tab switcher */}
      <div className="flex gap-1 bg-obsidian-800 rounded-lg p-1 w-fit">
        {([['list', 'Gastos'], ['dashboard', 'Dashboard']] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-gold-500 text-obsidian-900'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'list'      && <ExpensesListTab />}
      {activeTab === 'dashboard' && <ExpensesDashboardTab />}
    </div>
  )
}
