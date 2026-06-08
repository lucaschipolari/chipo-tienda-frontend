// ─── UI helpers ───────────────────────────────────────────────────────────────

export interface SelectOption<T = string> {
  label: string
  value: T
  disabled?: boolean
  description?: string
}

export type SortDirection = 'asc' | 'desc'

export interface SortingState {
  field: string
  direction: SortDirection
}

export interface PaginationState {
  page: number
  pageSize: number
}

export interface FilterState {
  [key: string]: string | number | boolean | string[] | undefined
}

// ─── Tamaños reutilizables ─────────────────────────────────────────────────────

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning'
export type ColorScheme = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'
export type Placement = 'top' | 'bottom' | 'left' | 'right'
export type Side = 'left' | 'right'

// ─── Navegación ───────────────────────────────────────────────────────────────

export interface NavItem {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: number | string
  children?: NavItem[]
  requiredRole?: string | string[]
  requiredPermission?: string
}

export interface NavGroup {
  title?: string
  items: NavItem[]
}

// ─── Columnas de tabla ─────────────────────────────────────────────────────────

export interface ColumnDef<T> {
  id: string
  header: string
  accessor?: keyof T | ((row: T) => unknown)
  cell?: (row: T) => React.ReactNode
  sortable?: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
  hidden?: boolean
}

// ─── Acciones de fila ──────────────────────────────────────────────────────────

export interface RowAction<T> {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: (row: T) => void
  hidden?: (row: T) => boolean
  disabled?: (row: T) => boolean
  variant?: 'default' | 'danger'
}

// ─── Estados de carga ──────────────────────────────────────────────────────────

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  label: string
  href?: string
}
