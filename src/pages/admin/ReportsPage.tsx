import { useState } from 'react'
import {
  BarChart2, Package, ShoppingBag, DollarSign, TrendingUp,
  FileSpreadsheet, FileText, File, Download,
} from 'lucide-react'
import { Button }     from '@/components/ui/Button/Button'
import { Input }      from '@/components/ui/Input/Input'
import { Select }     from '@/components/ui/Select/Select'
import { Badge }      from '@/components/ui/Badge/Badge'
import { Pagination } from '@/components/data-display/Pagination/Pagination'
import {
  useSalesReport,
  useInventoryReport,
  usePurchasesReport,
  useExpensesReport,
  useExportReport,
} from '@/features/reports/hooks/useReports'
import { useFinanceDashboard, useCashFlow } from '@/features/finance/hooks/useFinance'
import type { ReportFilter, ReportType, ReportFormat } from '@/types/report.types'
import { formatMoney } from '@/utils/helpers/formatMoney'

// ─── Tab config ───────────────────────────────────────────────────────────────

type TabKey = 'sales' | 'inventory' | 'purchases' | 'expenses' | 'financial'

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'sales',      label: 'Ventas',     icon: <BarChart2  className="h-4 w-4" /> },
  { key: 'inventory',  label: 'Inventario', icon: <Package    className="h-4 w-4" /> },
  { key: 'purchases',  label: 'Compras',    icon: <ShoppingBag className="h-4 w-4" /> },
  { key: 'expenses',   label: 'Gastos',     icon: <DollarSign  className="h-4 w-4" /> },
  { key: 'financial',  label: 'Financiero', icon: <TrendingUp  className="h-4 w-4" /> },
]

// ─── Export buttons ───────────────────────────────────────────────────────────

interface ExportButtonsProps {
  reportType: ReportType
  filter: ReportFilter
}

function ExportButtons({ reportType, filter }: ExportButtonsProps) {
  const { mutate: exportReport, isPending } = useExportReport()

  function doExport(format: ReportFormat) {
    exportReport({ reportType, format, filter })
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" loading={isPending} onClick={() => doExport('excel')}>
        <FileSpreadsheet className="h-3.5 w-3.5 mr-1" /> Excel
      </Button>
      <Button variant="outline" size="sm" loading={isPending} onClick={() => doExport('csv')}>
        <FileText className="h-3.5 w-3.5 mr-1" /> CSV
      </Button>
      <Button variant="outline" size="sm" loading={isPending} onClick={() => doExport('pdf')}>
        <File className="h-3.5 w-3.5 mr-1" /> PDF
      </Button>
    </div>
  )
}

// ─── Summary card ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-obsidian-900 rounded-xl p-4">
      <p className="text-xs text-neutral-400 mb-1">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  )
}

// ─── Sales Report Tab ─────────────────────────────────────────────────────────

function SalesReportTab() {
  const [filter, setFilter] = useState<ReportFilter>({ page: 1, pageSize: 15 })
  const [from, setFrom]     = useState('')
  const [to, setTo]         = useState('')
  const [status, setStatus] = useState('')
  const [applied, setApplied] = useState<ReportFilter>({})

  const { data, isLoading } = useSalesReport(applied)
  const rows       = data?.rows ?? []
  const totalPages = Math.ceil((data?.totalCount ?? 0) / (filter.pageSize ?? 15)) || 1

  function generate() {
    setApplied({ from: from || undefined, to: to || undefined, status: status || undefined, page: filter.page, pageSize: filter.pageSize })
  }

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="bg-obsidian-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Desde</label>
            <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Hasta</label>
            <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <Button size="sm" onClick={generate}>Generar reporte</Button>
          <ExportButtons reportType="sales" filter={applied} />
        </div>
      </div>

      {/* Summary */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard label="Total ventas"      value={data.totalCount} />
          <SummaryCard label="Total facturado"   value={`ARS ${formatMoney(data.totalRevenue)}`} />
          <SummaryCard label="Descuentos totales" value={`ARS ${formatMoney(data.totalDiscount)}`} />
          <SummaryCard label="Impuestos totales"  value={`ARS ${formatMoney(data.totalTax)}`} />
        </div>
      )}

      {/* Table */}
      <div className="bg-obsidian-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-700">
              {['N° Venta','Comprador','Canal','Pago','Subtotal','Descuento','Total','Fecha'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs text-neutral-400 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-neutral-500">Cargando...</td></tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-neutral-500">Genera el reporte para ver datos</td></tr>
            )}
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-neutral-800 hover:bg-obsidian-900 transition-colors">
                <td className="px-4 py-2.5 font-mono text-gold-400">{r.saleNumber}</td>
                <td className="px-4 py-2.5 text-white">{r.buyerName || r.customerName || '—'}</td>
                <td className="px-4 py-2.5 text-neutral-300">{r.channel}</td>
                <td className="px-4 py-2.5 text-neutral-300">{r.paymentMethod}</td>
                <td className="px-4 py-2.5 font-mono text-neutral-300">ARS {formatMoney(r.subtotal)}</td>
                <td className="px-4 py-2.5 font-mono text-neutral-300">ARS {formatMoney(r.discount)}</td>
                <td className="px-4 py-2.5 font-mono text-white font-semibold">ARS {formatMoney(r.total)}</td>
                <td className="px-4 py-2.5 text-neutral-400 whitespace-nowrap">
                  {new Date(r.date).toLocaleDateString('es-AR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
      {totalPages > 1 && (
        <Pagination
          page={filter.page ?? 1}
          totalPages={totalPages}
          onPageChange={p => { setFilter(f => ({ ...f, page: p })); setApplied(a => ({ ...a, page: p })) }}
        />
      )}
    </div>
  )
}

// ─── Inventory Report Tab ─────────────────────────────────────────────────────

const INV_STATUS_OPTIONS = [
  { value: '',          label: 'Todos los estados' },
  { value: 'OK',        label: 'OK' },
  { value: 'Critical',  label: 'Stock crítico' },
  { value: 'OutOfStock',label: 'Sin stock' },
]

function inventoryStatusVariant(status: string): 'success' | 'warning' | 'error' {
  if (status === 'OK')         return 'success'
  if (status === 'Critical')   return 'warning'
  return 'error'
}

function inventoryStatusLabel(status: string) {
  if (status === 'OK')          return 'OK'
  if (status === 'Critical')    return 'Crítico'
  if (status === 'OutOfStock')  return 'Sin stock'
  return status
}

function InventoryReportTab() {
  const [statusFilter, setStatusFilter] = useState('')
  const [applied, setApplied] = useState<{ categoryId?: string; status?: string }>({})
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 15

  const { data, isLoading } = useInventoryReport(applied.categoryId, applied.status)
  const rows = data?.rows ?? []
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(rows.length / PAGE_SIZE) || 1

  function generate() {
    setApplied({ status: statusFilter || undefined })
    setPage(1)
  }

  return (
    <div className="space-y-5">
      <div className="bg-obsidian-800 rounded-xl p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="min-w-[150px]">
            <label className="block text-xs text-neutral-400 mb-1">Estado</label>
            <Select options={INV_STATUS_OPTIONS} value={statusFilter} onChange={e => setStatusFilter((e as React.ChangeEvent<HTMLSelectElement>).target.value)} />
          </div>
          <Button size="sm" onClick={generate}>Generar reporte</Button>
          <ExportButtons reportType="inventory" filter={{ status: applied.status }} />
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard label="Total productos"       value={data.totalProducts} />
          <SummaryCard label="Sin stock"             value={data.outOfStock} />
          <SummaryCard label="Stock crítico"         value={data.critical} />
          <SummaryCard label="Valor total inventario" value={`ARS ${formatMoney(data.totalValue)}`} />
        </div>
      )}

      <div className="bg-obsidian-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-700">
              {['SKU','Producto','Variante','Categoría','Stock','Min Stock','Costo Unit.','Valor Total','Estado'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs text-neutral-400 font-medium whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-neutral-500">Cargando...</td></tr>
            )}
            {!isLoading && paged.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-10 text-center text-neutral-500">Genera el reporte para ver datos</td></tr>
            )}
            {paged.map((r, i) => (
              <tr key={i} className="border-b border-neutral-800 hover:bg-obsidian-900 transition-colors">
                <td className="px-4 py-2.5 font-mono text-gold-400 text-xs">{r.sku}</td>
                <td className="px-4 py-2.5 text-white">{r.productName}</td>
                <td className="px-4 py-2.5 text-neutral-300">{r.variantName || '—'}</td>
                <td className="px-4 py-2.5 text-neutral-300">{r.category}</td>
                <td className="px-4 py-2.5 text-white font-semibold">{r.currentStock}</td>
                <td className="px-4 py-2.5 text-neutral-400">{r.minStock}</td>
                <td className="px-4 py-2.5 font-mono text-neutral-300">ARS {formatMoney(r.unitCost)}</td>
                <td className="px-4 py-2.5 font-mono text-neutral-300">ARS {formatMoney(r.totalValue)}</td>
                <td className="px-4 py-2.5">
                  <Badge variant={inventoryStatusVariant(r.status)}>{inventoryStatusLabel(r.status)}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
    </div>
  )
}

// ─── Purchases Report Tab ─────────────────────────────────────────────────────

function PurchasesReportTab() {
  const [from, setFrom] = useState('')
  const [to, setTo]     = useState('')
  const [applied, setApplied] = useState<ReportFilter>({})
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 15

  const { data, isLoading } = usePurchasesReport(applied)
  const rows  = data?.rows ?? []
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(rows.length / PAGE_SIZE) || 1

  function generate() {
    setApplied({ from: from || undefined, to: to || undefined })
    setPage(1)
  }

  return (
    <div className="space-y-5">
      <div className="bg-obsidian-800 rounded-xl p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Desde</label>
            <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Hasta</label>
            <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <Button size="sm" onClick={generate}>Generar reporte</Button>
          <ExportButtons reportType="purchases" filter={applied} />
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-2 gap-4">
          <SummaryCard label="Total órdenes" value={data.totalCount} />
          <SummaryCard label="Total gastado"  value={`ARS ${formatMoney(data.totalSpent)}`} />
        </div>
      )}

      <div className="bg-obsidian-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-700">
              {['N° Orden','Proveedor','Estado','Ãtems','Total','Fecha'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs text-neutral-400 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-neutral-500">Cargando...</td></tr>
            )}
            {!isLoading && paged.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-neutral-500">Genera el reporte para ver datos</td></tr>
            )}
            {paged.map((r, i) => (
              <tr key={i} className="border-b border-neutral-800 hover:bg-obsidian-900 transition-colors">
                <td className="px-4 py-2.5 font-mono text-gold-400">{r.purchaseNumber}</td>
                <td className="px-4 py-2.5 text-white">{r.supplierName}</td>
                <td className="px-4 py-2.5 text-neutral-300">{r.status}</td>
                <td className="px-4 py-2.5 text-neutral-300">{r.itemCount}</td>
                <td className="px-4 py-2.5 font-mono text-white">ARS {formatMoney(r.total)}</td>
                <td className="px-4 py-2.5 text-neutral-400">
                  {new Date(r.date).toLocaleDateString('es-AR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
    </div>
  )
}

// ─── Expenses Report Tab ──────────────────────────────────────────────────────

function ExpensesReportTab() {
  const [from, setFrom]     = useState('')
  const [to, setTo]         = useState('')
  const [applied, setApplied] = useState<ReportFilter>({})
  const [page, setPage]     = useState(1)
  const PAGE_SIZE = 15

  const { data, isLoading } = useExpensesReport(applied)
  const rows  = data?.rows ?? []
  const paged = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(rows.length / PAGE_SIZE) || 1

  function generate() {
    setApplied({ from: from || undefined, to: to || undefined })
    setPage(1)
  }

  return (
    <div className="space-y-5">
      <div className="bg-obsidian-800 rounded-xl p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Desde</label>
            <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Hasta</label>
            <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <Button size="sm" onClick={generate}>Generar reporte</Button>
          <ExportButtons reportType="expenses" filter={applied} />
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-2 gap-4">
          <SummaryCard label="Total gastos"  value={data.totalCount} />
          <SummaryCard label="Total monto"   value={`ARS ${formatMoney(data.totalAmount)}`} />
        </div>
      )}

      <div className="bg-obsidian-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-700">
              {['Categoría','Fecha','Monto','Descripción','Estado'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs text-neutral-400 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-neutral-500">Cargando...</td></tr>
            )}
            {!isLoading && paged.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-neutral-500">Genera el reporte para ver datos</td></tr>
            )}
            {paged.map((r, i) => (
              <tr key={i} className="border-b border-neutral-800 hover:bg-obsidian-900 transition-colors">
                <td className="px-4 py-2.5 text-white">{r.category}</td>
                <td className="px-4 py-2.5 text-neutral-400">{new Date(r.date).toLocaleDateString('es-AR')}</td>
                <td className="px-4 py-2.5 font-mono text-gold-400">ARS {formatMoney(r.amount)}</td>
                <td className="px-4 py-2.5 text-neutral-300 max-w-xs truncate">{r.description}</td>
                <td className="px-4 py-2.5 text-neutral-300">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />}
    </div>
  )
}

// ─── Financial Report Tab ─────────────────────────────────────────────────────

function FinancialReportTab() {
  const [from, setFrom] = useState('')
  const [to, setTo]     = useState('')
  const [period, setPeriod] = useState('month')
  const [applied, setApplied] = useState({ period: 'month', from: undefined as string | undefined, to: undefined as string | undefined })

  const { data, isLoading } = useFinanceDashboard(applied.period, applied.from, applied.to)
  const { data: cf }        = useCashFlow('week', applied.from, applied.to)
  const exportMutation      = useExportReport()

  function generate() {
    setApplied({ period, from: from || undefined, to: to || undefined })
  }

  const kpis       = data?.kpis
  const cashEntries = cf?.entries ?? []

  return (
    <div className="space-y-5">
      <div className="bg-obsidian-800 rounded-xl p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Desde</label>
            <Input type="date" value={from} onChange={e => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Hasta</label>
            <Input type="date" value={to} onChange={e => setTo(e.target.value)} />
          </div>
          <Button size="sm" onClick={generate}>Generar reporte</Button>
          <ExportButtons
            reportType="financial"
            filter={{ from: applied.from, to: applied.to }}
          />
        </div>
      </div>

      {isLoading && <p className="text-neutral-500 text-sm text-center py-10">Cargando...</p>}

      {kpis && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <SummaryCard label="Ingresos"      value={`ARS ${formatMoney(kpis.totalRevenue)}`} />
            <SummaryCard label="Costos"        value={`ARS ${formatMoney(kpis.totalCosts)}`} />
            <SummaryCard label="Gastos"        value={`ARS ${formatMoney(kpis.totalExpenses)}`} />
            <SummaryCard label="Ganancia Neta" value={`ARS ${formatMoney(kpis.netProfit)}`} />
            <SummaryCard label="Margen Neto"   value={`${kpis.netMargin.toFixed(1)}%`} />
            <SummaryCard label="Margen Bruto"  value={`${kpis.grossMargin.toFixed(1)}%`} />
          </div>

          {/* Cash flow table */}
          <div className="bg-obsidian-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-700">
              <h3 className="text-sm font-semibold text-white">Flujo de Caja</h3>
            </div>
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-700">
                  {['Período','Entradas','Salidas','Balance'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-neutral-400 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cashEntries.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-neutral-500">Sin datos de flujo de caja</td></tr>
                )}
                {cashEntries.map((entry, i) => (
                  <tr key={i} className="border-b border-neutral-800 hover:bg-obsidian-900 transition-colors">
                    <td className="px-4 py-2.5 text-white">{entry.label}</td>
                    <td className="px-4 py-2.5 font-mono text-green-400">ARS {formatMoney(entry.inflows)}</td>
                    <td className="px-4 py-2.5 font-mono text-red-400">ARS {formatMoney(entry.outflows)}</td>
                    <td className="px-4 py-2.5 font-mono">
                      <span className={entry.balance >= 0 ? 'text-green-400' : 'text-red-400'}>
                        ARS {formatMoney(entry.balance)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('sales')

  return (
    <div className="p-6 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Reportes</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Sidebar — en mobile es una fila de tabs con scroll horizontal */}
        <aside className="w-full md:w-48 md:flex-shrink-0">
          <nav className="flex gap-2 overflow-x-auto pb-1 md:block md:space-y-1 md:overflow-visible md:pb-0">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`shrink-0 whitespace-nowrap md:w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  activeTab === tab.key
                    ? 'bg-gold-500/10 text-gold-400 border border-gold-500/30'
                    : 'text-neutral-400 hover:text-white hover:bg-obsidian-800'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {activeTab === 'sales'     && <SalesReportTab />}
          {activeTab === 'inventory' && <InventoryReportTab />}
          {activeTab === 'purchases' && <PurchasesReportTab />}
          {activeTab === 'expenses'  && <ExpensesReportTab />}
          {activeTab === 'financial' && <FinancialReportTab />}
        </main>
      </div>
    </div>
  )
}
