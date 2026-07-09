import { useState } from 'react'
import {
  Plus, X, Loader2, FolderOpen, Folder, ChevronRight,
  ChevronDown, Edit2, Trash2, ToggleLeft, ToggleRight, Tag,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  useCategories, useCreateCategory, useUpdateCategory,
  useDeleteCategory, flattenCategories,
} from '@/features/categories/hooks/useCategories'
import { cn } from '@/utils/helpers/cn'
import type { Category } from '@/types/catalog.types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const categorySchema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(150),
  slug: z.string().optional(),
  parentCategoryId: z.string().optional(),
  description: z.string().optional(),
  displayOrder: z.coerce.number().min(0).default(0),
  isActive: z.boolean().default(true),
})

type CategoryFormValues = z.infer<typeof categorySchema>

// ─── Create/Edit Modal ────────────────────────────────────────────────────────

function CategoryModal({
  mode, category, onClose,
}: {
  mode: 'create' | 'edit'
  category?: Category
  onClose: () => void
}) {
  const { data: categories } = useCategories(true)
  const flatCats = categories ? flattenCategories(categories).filter(c => c.id !== category?.id) : []
  const { mutate: createCategory, isPending: creating } = useCreateCategory()
  const { mutate: updateCategory, isPending: updating } = useUpdateCategory()
  const isPending = creating || updating

  const { register, handleSubmit, formState: { errors } } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: category ? {
      name: category.name,
      slug: category.slug,
      parentCategoryId: category.parentCategoryId ?? '',
      description: category.description ?? '',
      displayOrder: category.displayOrder,
      isActive: category.isActive,
    } : { isActive: true, displayOrder: 0 },
  })

  const onSubmit = (values: CategoryFormValues) => {
    const parentId = values.parentCategoryId || undefined
    if (mode === 'create') {
      createCategory({
        name: values.name,
        slug: values.slug,
        parentCategoryId: parentId,
        description: values.description,
        displayOrder: values.displayOrder,
      }, { onSuccess: onClose })
    } else if (category) {
      updateCategory({
        id: category.id,
        data: {
          id: category.id,
          name: values.name,
          slug: values.slug || category.slug,
          parentCategoryId: parentId,
          description: values.description,
          imageUrl: category.imageUrl,
          displayOrder: values.displayOrder,
          isActive: values.isActive ?? true,
        },
      }, { onSuccess: onClose })
    }
  }

  const inputCls = 'w-full px-3 py-2 rounded-xl text-sm bg-obsidian-800 border border-neutral-800 text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-gold-500/50'
  const labelCls = 'text-xs font-medium text-neutral-400 mb-1 block'
  const errorCls = 'text-xs text-red-400 mt-0.5'

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl border border-neutral-800 shadow-2xl" style={{ background: 'var(--surface)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <h2 className="font-semibold text-white">{mode === 'create' ? 'Nueva categoría' : 'Editar categoría'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-obsidian-700 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Nombre *</label>
            <input {...register('name')} className={inputCls} placeholder="Ej. Perfumes Árabes" />
            {errors.name && <p className={errorCls}>{errors.name.message}</p>}
          </div>

          <div>
            <label className={labelCls}>Slug (auto-generado si está vacío)</label>
            <input {...register('slug')} className={inputCls} placeholder="perfumes-arabes" />
          </div>

          <div>
            <label className={labelCls}>Categoría padre</label>
            <select {...register('parentCategoryId')} className={inputCls}>
              <option value="">Sin padre (categoría raíz)</option>
              {flatCats.map(c => (
                <option key={c.id} value={c.id}>
                  {'  '.repeat(c.depth)}{c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Orden de visualización</label>
              <input {...register('displayOrder')} type="number" className={inputCls} placeholder="0" />
            </div>
            {mode === 'edit' && (
              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 cursor-pointer pb-2">
                  <input type="checkbox" className="accent-gold-500" {...register('isActive')} />
                  <span className="text-sm text-neutral-300">Categoría activa</span>
                </label>
              </div>
            )}
          </div>

          <div>
            <label className={labelCls}>Descripción</label>
            <textarea {...register('description')} rows={2} className={cn(inputCls, 'resize-none')} placeholder="Descripción opcional..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-700 text-sm text-neutral-400 hover:text-white transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-semibold text-sm transition-colors disabled:opacity-60"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {isPending ? 'Guardando...' : mode === 'create' ? 'Crear' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Category Card (árbol) ────────────────────────────────────────────────────

function CategoryCard({
  category,
  depth = 0,
  onEdit,
  onDelete,
}: {
  category: Category
  depth?: number
  onEdit: (c: Category) => void
  onDelete: (c: Category) => void
}) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = category.subCategories.length > 0

  return (
    <div className={cn('rounded-xl border border-neutral-800', depth === 0 ? '' : 'ml-6 mt-2')}>
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 group',
          hasChildren && 'cursor-pointer',
          !category.isActive && 'opacity-50',
        )}
        onClick={() => hasChildren && setExpanded(p => !p)}
      >
        {/* Expand icon */}
        <div className="w-4 shrink-0">
          {hasChildren
            ? (expanded ? <ChevronDown className="h-3.5 w-3.5 text-neutral-500" /> : <ChevronRight className="h-3.5 w-3.5 text-neutral-500" />)
            : null}
        </div>

        {/* Folder icon */}
        {hasChildren
          ? <FolderOpen className="h-4 w-4 text-gold-400 shrink-0" />
          : <Folder className="h-4 w-4 text-neutral-600 shrink-0" />}

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{category.name}</span>
            {!category.isActive && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-500">Inactiva</span>
            )}
          </div>
          <p className="text-xs text-neutral-600 mt-0.5">
            /{category.slug} · {category.productCount} producto{category.productCount !== 1 ? 's' : ''}
            {hasChildren && ` · ${category.subCategories.length} subcategorías`}
          </p>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onEdit(category)}
            className="p-1.5 rounded-lg text-neutral-600 hover:text-white hover:bg-obsidian-700 transition-colors"
            title="Editar"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(category)}
            className="p-1.5 rounded-lg text-neutral-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            title="Desactivar"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Subcategorías */}
      {expanded && hasChildren && (
        <div className="px-4 pb-3 space-y-0 border-t border-neutral-800/60">
          {category.subCategories.map((sub) => (
            <CategoryCard key={sub.id} category={sub} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Delete confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({ category, onClose }: { category: Category; onClose: () => void }) {
  const { mutate: deleteCategory, isPending } = useDeleteCategory()
  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl border border-neutral-800 p-6 shadow-2xl" style={{ background: 'var(--surface)' }}>
        <h3 className="font-semibold text-white mb-2">¿Desactivar categoría?</h3>
        <p className="text-sm text-neutral-400 mb-5">
          "<strong className="text-neutral-200">{category.name}</strong>" será desactivada.
          Los productos asociados no se verán afectados.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-neutral-700 text-sm text-neutral-400 hover:text-white transition-colors">
            Cancelar
          </button>
          <button
            onClick={() => deleteCategory(category.id, { onSuccess: onClose })}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/80 hover:bg-red-500 text-white font-medium text-sm transition-colors disabled:opacity-60"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Desactivar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Página ────────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  const { data: categories, isLoading } = useCategories(true)

  const totalActive = categories?.filter(c => c.isActive).length ?? 0
  const totalAll = categories?.length ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-white tracking-wide">Categorías</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {totalActive} activas de {totalAll} totales
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-semibold text-sm transition-colors"
        >
          <Plus className="h-4 w-4" /> Nueva categoría
        </button>
      </div>

      {/* Tree */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
        </div>
      ) : !categories?.length ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-neutral-800" style={{ background: 'var(--surface)' }}>
          <Tag className="h-10 w-10 text-neutral-700 mb-3" />
          <p className="text-neutral-400 font-medium">No hay categorías todavía</p>
          <p className="text-neutral-600 text-sm mt-1">Crea la primera categoría para organizar el catálogo.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.filter(c => !c.parentCategoryId).map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {showCreate && <CategoryModal mode="create" onClose={() => setShowCreate(false)} />}
      {editTarget && <CategoryModal mode="edit" category={editTarget} onClose={() => setEditTarget(null)} />}
      {deleteTarget && <DeleteConfirm category={deleteTarget} onClose={() => setDeleteTarget(null)} />}
    </div>
  )
}
