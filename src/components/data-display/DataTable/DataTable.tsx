import { ArrowUpDown, ArrowUp, ArrowDown, Download } from 'lucide-react'
import { cn } from '@/utils/helpers/cn'
import { Pagination } from '../Pagination/Pagination'
import { EmptyState } from '../EmptyState/EmptyState'
import { TableRowSkeleton } from '@/components/ui/Skeleton/Skeleton'
import { Button } from '@/components/ui/Button'
import type { ColumnDef, PaginationState, RowAction, SortingState } from '@/types/common.types'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface DataTableProps<T extends object> {
  /** Definición de columnas */
  columns: ColumnDef<T>[]
  /** Datos de la tabla */
  data: T[]
  /** Total de registros (para paginación del servidor) */
  totalCount?: number
  /** Función para extraer el key único de cada fila */
  rowKey: keyof T | ((row: T) => string)
  /** Estado de carga inicial */
  isLoading?: boolean
  /** Fetching en background (spinner suave, no bloquea) */
  isFetching?: boolean
  /** Paginación controlada */
  pagination?: PaginationState
  onPaginationChange?: (page: number) => void
  /** Ordenamiento controlado */
  sorting?: SortingState | null
  onSortingChange?: (field: string) => void
  /** Callback al hacer click en una fila */
  onRowClick?: (row: T) => void
  /** Acciones por fila (menú contextual) */
  rowActions?: RowAction<T>[]
  /** Slot para toolbar (filtros, botón crear, búsqueda) */
  toolbar?: React.ReactNode
  /** Estado vacío personalizado */
  emptyState?: React.ReactNode
  /** Habilitar exportación */
  onExport?: () => void
  /** Clases adicionales */
  className?: string
}

// ─── Helper para extraer el valor de una celda ───────────────────────────────

function getCellValue<T extends object>(
  row: T,
  accessor: ColumnDef<T>['accessor'],
): React.ReactNode {
  if (!accessor) return null
  if (typeof accessor === 'function') return String(accessor(row) ?? '')
  const val = row[accessor]
  if (val === null || val === undefined) return '—'
  return String(val)
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function DataTable<T extends object>({
  columns,
  data,
  totalCount,
  rowKey,
  isLoading = false,
  isFetching = false,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  onRowClick,
  rowActions,
  toolbar,
  emptyState,
  onExport,
  className,
}: DataTableProps<T>) {
  const visibleColumns = columns.filter((c) => !c.hidden)
  const totalPages = pagination && totalCount
    ? Math.ceil(totalCount / pagination.pageSize)
    : undefined

  const getRowKey = (row: T, idx: number): string => {
    if (typeof rowKey === 'function') return rowKey(row)
    const val = row[rowKey]
    return val !== undefined && val !== null ? String(val) : String(idx)
  }

  const getSortIcon = (field: string) => {
    if (sorting?.field !== field) {
      return <ArrowUpDown className="h-3 w-3 text-neutral-600 ml-1 shrink-0" />
    }
    return sorting.direction === 'asc'
      ? <ArrowUp className="h-3 w-3 text-gold-400 ml-1 shrink-0" />
      : <ArrowDown className="h-3 w-3 text-gold-400 ml-1 shrink-0" />
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>

      {/* ── Toolbar ── */}
      {(toolbar || onExport) && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex-1">{toolbar}</div>
          {onExport && (
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Download className="h-3.5 w-3.5" />}
              onClick={onExport}
            >
              Exportar
            </Button>
          )}
        </div>
      )}

      {/* ── Tabla ── */}
      <div className="rounded-2xl bg-obsidian-900 border border-neutral-800 overflow-hidden">
        {/* Indicador de fetching en background */}
        {isFetching && !isLoading && (
          <div className="h-0.5 bg-gold-500/30 overflow-hidden">
            <div className="h-full bg-gold-500 w-1/3 animate-[shimmer_1.5s_infinite_linear]" />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {/* ── Head ── */}
            <thead>
              <tr className="border-b border-neutral-800">
                {visibleColumns.map((col) => (
                  <th
                    key={col.id}
                    scope="col"
                    style={col.width ? { width: col.width, minWidth: col.width } : undefined}
                    className={cn(
                      'px-4 py-3 text-left',
                      'text-xs font-semibold uppercase tracking-wider',
                      'text-neutral-500 whitespace-nowrap',
                      col.align === 'center' && 'text-center',
                      col.align === 'right'  && 'text-right',
                    )}
                  >
                    {col.sortable ? (
                      <button
                        onClick={() => onSortingChange?.(col.id)}
                        className={cn(
                          'flex items-center gap-0 hover:text-white transition-colors',
                          col.align === 'center' && 'justify-center mx-auto',
                          col.align === 'right' && 'justify-end ml-auto',
                          sorting?.field === col.id && 'text-gold-400',
                        )}
                      >
                        {col.header}
                        {getSortIcon(col.id)}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                ))}

                {rowActions && rowActions.length > 0 && (
                  <th scope="col" className="px-4 py-3 w-16 text-right">
                    <span className="sr-only">Acciones</span>
                  </th>
                )}
              </tr>
            </thead>

            {/* ── Body ── */}
            <tbody className="divide-y divide-neutral-800/60">
              {/* Skeleton de carga */}
              {isLoading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRowSkeleton
                    key={i}
                    cols={visibleColumns.length + (rowActions ? 1 : 0)}
                  />
                ))}

              {/* Datos */}
              {!isLoading &&
                data.map((row, idx) => (
                  <tr
                    key={getRowKey(row, idx)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      'transition-colors duration-150',
                      'hover:bg-obsidian-800/60',
                      onRowClick && 'cursor-pointer',
                    )}
                  >
                    {visibleColumns.map((col) => (
                      <td
                        key={col.id}
                        className={cn(
                          'px-4 py-3 text-sm text-neutral-300 whitespace-nowrap',
                          col.align === 'center' && 'text-center',
                          col.align === 'right'  && 'text-right',
                        )}
                      >
                        {col.cell
                          ? col.cell(row)
                          : getCellValue(row, col.accessor)}
                      </td>
                    ))}

                    {/* Acciones por fila */}
                    {rowActions && rowActions.length > 0 && (
                      <td className="px-4 py-3 text-right">
                        <RowActionsMenu row={row} actions={rowActions} />
                      </td>
                    )}
                  </tr>
                ))}

              {/* Estado vacío */}
              {!isLoading && data.length === 0 && (
                <tr>
                  <td
                    colSpan={visibleColumns.length + (rowActions ? 1 : 0)}
                    className="p-0"
                  >
                    {emptyState ?? (
                      <EmptyState
                        title="Sin resultados"
                        description="No hay datos que coincidan con los filtros aplicados."
                      />
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Footer: count + paginación ── */}
        {pagination && totalPages && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-800 flex-wrap gap-3">
            <p className="text-xs text-neutral-500">
              {totalCount !== undefined && (
                <>
                  {((pagination.page - 1) * pagination.pageSize) + 1}
                  {' – '}
                  {Math.min(pagination.page * pagination.pageSize, totalCount)}
                  {' de '}
                  <span className="text-neutral-300 font-medium">{totalCount}</span>
                  {' registros'}
                </>
              )}
            </p>
            <Pagination
              page={pagination.page}
              totalPages={totalPages}
              onPageChange={(p) => onPaginationChange?.(p)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Row Actions Menu ─────────────────────────────────────────────────────────

function RowActionsMenu<T extends object>({
  row,
  actions,
}: {
  row: T
  actions: RowAction<T>[]
}) {
  const visibleActions = actions.filter((a) => !a.hidden?.(row))
  if (visibleActions.length === 0) return null

  return (
    <div className="flex items-center justify-end gap-1">
      {visibleActions.map((action, i) => {
        const Icon = action.icon
        const isDisabled = action.disabled?.(row) ?? false

        return (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation()
              if (!isDisabled) action.onClick(row)
            }}
            disabled={isDisabled}
            title={action.label}
            className={cn(
              'p-1.5 rounded-lg transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500',
              'disabled:opacity-40 disabled:pointer-events-none',
              action.variant === 'danger'
                ? 'text-neutral-500 hover:text-danger-400 hover:bg-danger-500/10'
                : 'text-neutral-500 hover:text-white hover:bg-obsidian-700',
            )}
          >
            {Icon ? <Icon className="h-4 w-4" /> : action.label}
          </button>
        )
      })}
    </div>
  )
}
