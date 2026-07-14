import { useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Plus, Search, Edit2, Eye,
  Package, TrendingUp, AlertTriangle, ChevronDown, X, Loader2,
  CheckCircle2, XCircle, Clock,
} from 'lucide-react'
import { useForm, Controller, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDebounce } from '@/hooks/useDebounce'
import {
  useProducts, useProduct, useCreateProduct, useUpdateProduct,
  useChangeProductStatus, useUpdateVariant, useAddVariant,
  useAddProductImage, useRemoveProductImage, useConfigureDecant,
} from '@/features/products/hooks/useProducts'
import { useAdjustStock } from '@/features/inventory/hooks/useInventory'
import { useCategories, flattenCategories } from '@/features/categories/hooks/useCategories'
import { cn } from '@/utils/helpers/cn'
import { formatCurrency } from '@/utils/formatters/currency'
import type {
  ProductListItem, ProductStatus, ProductImage,
  CreateProductRequest, UpdateProductRequest, UpdateVariantRequest,
  OlfactoryProfile,
} from '@/types/catalog.types'

// ─── Helpers ───────────────────────────────────────────────────────────────────

const SEASONS = ['Primavera', 'Verano', 'Otoño', 'Invierno']
const OCCASIONS = ['Día', 'Noche', 'Formal', 'Casual']
const LONGEVITY_OPTIONS = ['3-4 horas', '4-6 horas', '6-8 horas', '8-12 horas', '12+ horas']

const EMPTY_OLFACTORY: OlfactoryProfile = {
  topNotes: [], heartNotes: [], baseNotes: [],
  intensity: null, longevity: null, seasons: [], occasions: [],
}

function splitCsv(s: string): string[] {
  return s.split(',').map(x => x.trim()).filter(Boolean)
}

/**
 * OlfactoryFields — sección de perfil olfativo para crear/editar producto.
 * Estado interno; emite el perfil completo por onChange en cada cambio.
 */
function OlfactoryFields({
  initial,
  onChange,
}: {
  initial?: OlfactoryProfile
  onChange: (v: OlfactoryProfile) => void
}) {
  const [top, setTop] = useState((initial?.topNotes ?? []).join(', '))
  const [heart, setHeart] = useState((initial?.heartNotes ?? []).join(', '))
  const [base, setBase] = useState((initial?.baseNotes ?? []).join(', '))
  const [intensity, setIntensity] = useState<number | ''>(initial?.intensity ?? '')
  const [longevity, setLongevity] = useState(initial?.longevity ?? '')
  const [seasons, setSeasons] = useState<string[]>(initial?.seasons ?? [])
  const [occasions, setOccasions] = useState<string[]>(initial?.occasions ?? [])

  useEffect(() => {
    onChange({
      topNotes: splitCsv(top),
      heartNotes: splitCsv(heart),
      baseNotes: splitCsv(base),
      intensity: intensity === '' ? null : Number(intensity),
      longevity: longevity.trim() || null,
      seasons,
      occasions,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [top, heart, base, intensity, longevity, seasons, occasions])

  const toggle = (list: string[], set: (v: string[]) => void, val: string) =>
    set(list.includes(val) ? list.filter(x => x !== val) : [...list, val])

  const chip = (active: boolean) => cn(
    'rounded-full px-3 py-1 text-xs font-medium ring-1 transition-colors',
    active ? 'bg-gold-500 text-black ring-gold-500' : 'text-neutral-400 ring-neutral-700 hover:text-white hover:ring-neutral-500',
  )

  return (
    <div className="rounded-xl border border-neutral-800 p-4 space-y-4">
      <p className="text-xs font-semibold text-gold-400 uppercase tracking-wider">Perfil olfativo (opcional)</p>

      {/* Notas — separadas por coma */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Notas de salida</label>
          <input value={top} onChange={e => setTop(e.target.value)} className={inputCls} placeholder="Bergamota, Limón" />
        </div>
        <div>
          <label className={labelCls}>Notas de corazón</label>
          <input value={heart} onChange={e => setHeart(e.target.value)} className={inputCls} placeholder="Jazmín, Rosa" />
        </div>
        <div>
          <label className={labelCls}>Notas de fondo</label>
          <input value={base} onChange={e => setBase(e.target.value)} className={inputCls} placeholder="Sándalo, Vainilla" />
        </div>
      </div>
      <p className="text-[11px] text-neutral-600 -mt-2">Separá cada nota con una coma.</p>

      {/* Intensidad + duración */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Intensidad</label>
          <select value={intensity} onChange={e => setIntensity(e.target.value === '' ? '' : Number(e.target.value))} className={inputCls}>
            <option value="">Sin definir</option>
            <option value={1}>1 · Muy suave</option>
            <option value={2}>2 · Suave</option>
            <option value={3}>3 · Moderada</option>
            <option value={4}>4 · Fuerte</option>
            <option value={5}>5 · Muy fuerte</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Duración</label>
          <select value={longevity} onChange={e => setLongevity(e.target.value)} className={inputCls}>
            <option value="">Sin definir</option>
            {LONGEVITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {/* Estaciones */}
      <div>
        <label className={labelCls}>Estación ideal</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {SEASONS.map(s => (
            <button key={s} type="button" onClick={() => toggle(seasons, setSeasons, s)} className={chip(seasons.includes(s))}>{s}</button>
          ))}
        </div>
      </div>

      {/* Momento */}
      <div>
        <label className={labelCls}>Momento ideal</label>
        <div className="flex flex-wrap gap-2 mt-1">
          {OCCASIONS.map(o => (
            <button key={o} type="button" onClick={() => toggle(occasions, setOccasions, o)} className={chip(occasions.includes(o))}>{o}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
}

// ─── Status badge ──────────────────────────────────────────────────────────────

const STATUS_MAP = {
  Draft:        { label: 'Borrador',      icon: Clock,        color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  Published:    { label: 'Publicado',     icon: CheckCircle2, color: 'text-green-400',  bg: 'bg-green-400/10'  },
  Discontinued: { label: 'Discontinuado', icon: XCircle,      color: 'text-neutral-500',bg: 'bg-neutral-500/10'},
}

function StatusBadge({ status }: { status: ProductStatus }) {
  const cfg = STATUS_MAP[status] ?? STATUS_MAP.Draft
  const Icon = cfg.icon
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full', cfg.bg, cfg.color)}>
      <Icon className="h-3 w-3" />{cfg.label}
    </span>
  )
}

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <span className="text-xs text-red-400 font-medium">Sin stock</span>
  if (stock <= 5)  return <span className="text-xs text-yellow-400 font-medium">{stock} (bajo)</span>
  return <span className="text-xs text-neutral-300 font-medium">{stock}</span>
}

// ─── Shared form styles ────────────────────────────────────────────────────────

const inputCls = cn(
  'w-full px-3 py-2 rounded-xl text-sm',
  'bg-obsidian-800 border border-neutral-800 text-white placeholder:text-neutral-600',
  'focus:outline-none focus:ring-1 focus:ring-gold-500/50 focus:border-gold-500/50',
)
const errorCls = 'text-xs text-red-400 mt-0.5'
const labelCls = 'text-xs font-medium text-neutral-400 mb-1 block'

// ─── Create Product Modal ─────────────────────────────────────────────────────

const variantSchema = z.object({
  label:             z.string().optional(),   // Tamaño: 5ml, 10ml, 30ml…
  sku:               z.string().min(1, 'SKU requerido'),
  price:             z.coerce.number().min(0).optional(),
  compareAtPrice:    z.coerce.number().min(0).optional(),
  cost:              z.coerce.number().min(0).optional(),
  initialStock:      z.coerce.number().min(0).default(0),
  minStockThreshold: z.coerce.number().min(0).default(5),
})

const productSchema = z.object({
  name:            z.string().min(1, 'Nombre requerido').max(200),
  sku:             z.string().min(1, 'SKU requerido').max(100),
  categoryId:      z.string().min(1, 'Categoría requerida'),
  basePrice:       z.coerce.number().min(0, 'Precio debe ser ≥ 0'),
  currency:        z.string().length(3, 'Moneda inválida'),
  compareAtPrice:  z.coerce.number().min(0).optional().or(z.literal('')),
  cost:            z.coerce.number().min(0).optional().or(z.literal('')),
  description:     z.string().optional(),
  isFeatured:      z.boolean().default(false),
  variants:        z.array(variantSchema).min(1, 'Agregá al menos una variante'),
})

type ProductFormValues = z.infer<typeof productSchema>

function CreateProductModal({ onClose }: { onClose: () => void }) {
  const { data: categories } = useCategories(true)
  const flatCats = categories ? flattenCategories(categories) : []
  const { mutate: createProduct, isPending } = useCreateProduct()

  const {
    register, handleSubmit, control, watch, setValue,
    formState: { errors },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      currency: 'ARS', isFeatured: false,
      variants: [{ initialStock: 0, minStockThreshold: 5 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'variants' })

  // Auto-completar el SKU de la primera variante desde el SKU del producto
  const productSku = watch('sku')
  const [olfactory, setOlfactory] = useState<OlfactoryProfile>(EMPTY_OLFACTORY)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [imgInput, setImgInput] = useState('')

  const addImage = () => {
    const url = imgInput.trim()
    if (!url) return
    setImageUrls(prev => prev.includes(url) ? prev : [...prev, url])
    setImgInput('')
  }
  const removeImage = (url: string) => setImageUrls(prev => prev.filter(u => u !== url))

  const onSubmit = (values: ProductFormValues) => {
    const payload: CreateProductRequest = {
      categoryId: values.categoryId,
      name: values.name,
      sku: values.sku,
      basePrice: values.basePrice,
      currency: values.currency,
      compareAtPrice: values.compareAtPrice ? Number(values.compareAtPrice) : undefined,
      description: values.description,
      isFeatured: values.isFeatured,
      tags: [],
      initialVariants: values.variants.map(v => ({
        sku: v.sku,
        attributes: v.label ? { 'Tamaño': v.label } : {},
        initialStock: v.initialStock,
        price: v.price || undefined,
        compareAtPrice: v.compareAtPrice || undefined,
        cost: v.cost || (values.cost ? Number(values.cost) : undefined),
        minStockThreshold: v.minStockThreshold,
      })),
      olfactory,
      imageUrls,
    }

    createProduct(payload, { onSuccess: () => onClose() })
  }

  return (
    <ModalShell title="Nuevo producto" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nombre *</label>
            <input {...register('name')} className={inputCls} placeholder="Ej. Perfume Oud Royal" />
            {errors.name && <p className={errorCls}>{errors.name.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Categoría *</label>
            <select {...register('categoryId')} className={inputCls}>
              <option value="">Seleccionar categoría</option>
              {flatCats.filter(c => c.isActive).map((c) => (
                <option key={c.id} value={c.id}>{'  '.repeat(c.depth)}{c.depth > 0 ? '└ ' : ''}{c.name}</option>
              ))}
            </select>
            {errors.categoryId && <p className={errorCls}>{errors.categoryId.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>SKU *</label>
            <input {...register('sku')} className={inputCls} placeholder="PRD-001"
              onChange={e => {
                setValue('sku', e.target.value)
                if (!watch('variants.0.sku') || watch('variants.0.sku') === productSku + '-V1') {
                  setValue('variants.0.sku', e.target.value + '-V1')
                }
              }}
            />
            {errors.sku && <p className={errorCls}>{errors.sku.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Precio base *</label>
            <input {...register('basePrice')} type="number" step="0.01" className={inputCls} placeholder="0.00" />
            {errors.basePrice && <p className={errorCls}>{errors.basePrice.message}</p>}
          </div>
          <div>
            <label className={labelCls}>Moneda</label>
            <select {...register('currency')} className={inputCls}>
              <option value="ARS">ARS — Peso argentino</option>
              <option value="USD">USD — Dólar</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Precio tachado (opcional)</label>
            <input {...register('compareAtPrice')} type="number" step="0.01" className={inputCls} placeholder="Precio original" />
          </div>
          <div>
            <label className={labelCls}>Costo (para ganancia)</label>
            <input {...register('cost')} type="number" step="0.01" className={inputCls} placeholder="Lo que te costó a vos" />
          </div>
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <Controller control={control} name="isFeatured" render={({ field }) => (
                <input type="checkbox" className="accent-gold-500" checked={field.value} onChange={field.onChange} />
              )} />
              <span className="text-sm text-neutral-300">Producto destacado</span>
            </label>
          </div>
        </div>
        <p className="-mt-3 text-[11px] text-neutral-600">
          El costo no se calcula solo: es lo que pagás vos por el producto. La ganancia = precio de venta − costo. En decants podés poner un costo distinto por tamaño abajo.
        </p>

        <div>
          <label className={labelCls}>Descripción</label>
          <textarea {...register('description')} rows={3} className={cn(inputCls, 'resize-none')} placeholder="Contá la historia del perfume: inspiración, cuándo usarlo, para quién es…" />
        </div>

        {/* Imágenes por link (Google Drive u otra URL) */}
        <div className="rounded-xl border border-neutral-800 p-4">
          <p className="mb-1 text-xs font-semibold text-gold-400 uppercase tracking-wider">Imágenes</p>
          <p className="mb-3 text-[11px] text-neutral-600">
            Pegá el link de una imagen (podés usar el de <b>compartir</b> de Google Drive; se convierte solo).
            La primera imagen es la principal.
          </p>
          <div className="flex gap-2">
            <input
              value={imgInput}
              onChange={e => setImgInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addImage() } }}
              className={inputCls}
              placeholder="https://drive.google.com/file/d/…/view"
            />
            <button
              type="button"
              onClick={addImage}
              className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-neutral-700 px-3 py-1 text-xs text-neutral-300 hover:border-neutral-500 hover:text-white transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Agregar
            </button>
          </div>
          {imageUrls.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {imageUrls.map((url, i) => (
                <li key={url} className="flex items-center gap-2 rounded-lg bg-neutral-900/50 px-3 py-1.5">
                  <span className="text-[10px] uppercase tracking-wider text-neutral-500 shrink-0">
                    {i === 0 ? 'Principal' : `#${i + 1}`}
                  </span>
                  <span className="flex-1 truncate text-xs text-neutral-400">{url}</span>
                  <button type="button" onClick={() => removeImage(url)} className="text-neutral-600 hover:text-red-400 transition-colors">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <OlfactoryFields onChange={setOlfactory} />

        <div className="rounded-xl border border-neutral-800 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold text-gold-400 uppercase tracking-wider">
              Variantes / tamaños
            </p>
            <button
              type="button"
              onClick={() => append({ sku: `${productSku || 'VAR'}-${fields.length + 1}`, initialStock: 0, minStockThreshold: 5, label: '' })}
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-700 px-2.5 py-1 text-xs text-neutral-300 hover:border-neutral-500 hover:text-white transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Agregar tamaño
            </button>
          </div>
          <p className="mb-3 text-[11px] text-neutral-600">
            Dejá el tamaño vacío si es un producto único. Para decants, agregá una fila por cada tamaño (5ml, 10ml…), cada uno con su precio.
          </p>

          <div className="space-y-3">
            {fields.map((field, i) => (
              <div key={field.id} className="rounded-lg bg-neutral-900/50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-wider text-neutral-500">Variante {i + 1}</span>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => remove(i)} className="text-neutral-600 hover:text-red-400 transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div>
                    <label className={labelCls}>Tamaño</label>
                    <input {...register(`variants.${i}.label`)} className={inputCls} placeholder="Ej. 5ml" />
                  </div>
                  <div>
                    <label className={labelCls}>SKU *</label>
                    <input {...register(`variants.${i}.sku`)} className={inputCls} placeholder="VAR-001" />
                    {errors.variants?.[i]?.sku && <p className={errorCls}>{errors.variants[i]?.sku?.message}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Stock</label>
                    <input {...register(`variants.${i}.initialStock`)} type="number" className={inputCls} placeholder="0" />
                  </div>
                  <div>
                    <label className={labelCls}>Precio</label>
                    <input {...register(`variants.${i}.price`)} type="number" step="0.01" className={inputCls} placeholder="Vacío = precio base" />
                  </div>
                  <div>
                    <label className={labelCls}>Precio tachado</label>
                    <input {...register(`variants.${i}.compareAtPrice`)} type="number" step="0.01" className={inputCls} placeholder="Descuento (opc.)" />
                  </div>
                  <div>
                    <label className={labelCls}>Costo</label>
                    <input {...register(`variants.${i}.cost`)} type="number" step="0.01" className={inputCls} placeholder="Tu costo (para ganancia)" />
                  </div>
                  <div>
                    <label className={labelCls}>Stock mín.</label>
                    <input {...register(`variants.${i}.minStockThreshold`)} type="number" className={inputCls} placeholder="5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-neutral-700 text-sm text-neutral-400 hover:text-white hover:border-neutral-600 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={isPending}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-semibold text-sm transition-colors disabled:opacity-60">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {isPending ? 'Creando...' : 'Crear producto'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}

// ─── Edit Product Modal ───────────────────────────────────────────────────────

const editSchema = z.object({
  name:           z.string().min(1, 'Nombre requerido').max(200),
  slug:           z.string().min(1, 'Slug requerido').max(250)
    .regex(/^[a-z0-9-]+$/, 'Solo letras minúsculas, números y guiones'),
  categoryId:     z.string().min(1, 'Categoría requerida'),
  basePrice:      z.coerce.number().min(0),
  currency:       z.string().length(3),
  compareAtPrice: z.coerce.number().min(0).optional().or(z.literal('')),
  description:    z.string().optional(),
  isFeatured:     z.boolean(),
})

type EditFormValues = z.infer<typeof editSchema>

const variantEditSchema = z.object({
  price:             z.coerce.number().min(0).optional().or(z.literal('')),
  compareAtPrice:    z.coerce.number().min(0).optional().or(z.literal('')),
  cost:              z.coerce.number().min(0).optional().or(z.literal('')),
  currency:          z.string().length(3),
  minStockThreshold: z.coerce.number().min(0),
  isActive:          z.boolean(),
})
type VariantEditValues = z.infer<typeof variantEditSchema>

function EditProductModal({ productId, onClose }: { productId: string; onClose: () => void }) {
  const { data: categories } = useCategories(true)
  const flatCats = categories ? flattenCategories(categories) : []
  const { data: product, isLoading } = useProduct(productId)
  const { mutate: updateProduct, isPending: savingProduct } = useUpdateProduct()
  const { mutate: updateVariant, isPending: savingVariant } = useUpdateVariant()
  const { mutate: addVariant, isPending: addingVariant } = useAddVariant()

  const [activeTab, setActiveTab] = useState<'info' | 'variants' | 'images'>('info')
  const [variantMsg, setVariantMsg] = useState<string | null>(null)
  const [newVar, setNewVar] = useState({ label: '', sku: '', price: '', compareAtPrice: '', cost: '', stock: '0' })
  const [olfactory, setOlfactory] = useState<OlfactoryProfile>(EMPTY_OLFACTORY)

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: '', slug: '', categoryId: '', basePrice: 0,
      currency: 'ARS', description: '', isFeatured: false,
    },
  })

  // Populate form once product loads
  const [populated, setPopulated] = useState(false)
  if (product && !populated) {
    form.reset({
      name:           product.name,
      slug:           product.slug,
      categoryId:     product.categoryId,
      basePrice:      product.basePrice,
      currency:       product.currency,
      compareAtPrice: product.compareAtPrice ?? undefined,
      description:    product.description ?? '',
      isFeatured:     product.isFeatured,
    })
    setOlfactory(product.olfactory ?? EMPTY_OLFACTORY)
    setPopulated(true)
  }

  const onSubmitInfo = (values: EditFormValues) => {
    const req: UpdateProductRequest = {
      id: productId,
      olfactory,
      categoryId: values.categoryId,
      name: values.name,
      slug: values.slug,
      basePrice: values.basePrice,
      currency: values.currency,
      compareAtPrice: values.compareAtPrice ? Number(values.compareAtPrice) : undefined,
      description: values.description,
      isFeatured: values.isFeatured,
      tags: product?.tags ?? [],
    }
    updateProduct({ id: productId, data: req }, { onSuccess: () => onClose() })
  }

  return (
    <ModalShell title={`Editar: ${product?.name ?? '…'}`} onClose={onClose}>
      {isLoading ? (
        <div className="p-10 text-center text-neutral-500"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex border-b border-neutral-800 px-6">
            {(['info', 'variants', 'images'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab
                    ? 'border-gold-500 text-gold-400'
                    : 'border-transparent text-neutral-500 hover:text-white',
                )}>
                {tab === 'info' ? 'Información' : tab === 'variants' ? 'Variantes' : 'Imágenes'}
              </button>
            ))}
          </div>

          {/* Tab: Info */}
          {activeTab === 'info' && (
            <form onSubmit={form.handleSubmit(onSubmitInfo)} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Nombre *</label>
                  <input {...form.register('name')} className={inputCls}
                    onChange={e => {
                      form.setValue('name', e.target.value)
                      form.setValue('slug', slugify(e.target.value))
                    }}
                  />
                  {form.formState.errors.name && <p className={errorCls}>{form.formState.errors.name.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Slug</label>
                  <input {...form.register('slug')} className={inputCls} />
                  {form.formState.errors.slug && <p className={errorCls}>{form.formState.errors.slug.message}</p>}
                </div>
              </div>

              <div>
                <label className={labelCls}>Categoría *</label>
                <select {...form.register('categoryId')} className={inputCls}>
                  <option value="">Seleccionar categoría</option>
                  {flatCats.filter(c => c.isActive).map((c) => (
                    <option key={c.id} value={c.id}>{'  '.repeat(c.depth)}{c.depth > 0 ? '└ ' : ''}{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelCls}>Precio base *</label>
                  <input {...form.register('basePrice')} type="number" step="0.01" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Moneda</label>
                  <select {...form.register('currency')} className={inputCls}>
                    <option value="ARS">ARS — Peso argentino</option>
                    <option value="USD">USD — Dólar</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Precio tachado</label>
                  <input {...form.register('compareAtPrice')} type="number" step="0.01" className={inputCls} placeholder="Opcional" />
                </div>
              </div>

              <div>
                <label className={labelCls}>Descripción</label>
                <textarea {...form.register('description')} rows={3} className={cn(inputCls, 'resize-none')} placeholder="Contá la historia del perfume: inspiración, cuándo usarlo, para quién es…" />
              </div>

              {/* key fuerza re-montar OlfactoryFields cuando cargan los datos del producto */}
              <OlfactoryFields key={populated ? 'loaded' : 'empty'} initial={olfactory} onChange={setOlfactory} />

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Controller control={form.control} name="isFeatured" render={({ field }) => (
                    <input type="checkbox" className="accent-gold-500" checked={field.value} onChange={field.onChange} />
                  )} />
                  <span className="text-sm text-neutral-300">Producto destacado</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-700 text-sm text-neutral-400 hover:text-white transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={savingProduct}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-semibold text-sm disabled:opacity-60 transition-colors">
                  {savingProduct ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {savingProduct ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          )}

          {/* Tab: Variants */}
          {activeTab === 'variants' && (
            <div className="p-6 space-y-4">
              {product && (product.isDecant || product.categoryName === 'Decants') && (
                <DecantPanel product={product} />
              )}
              {variantMsg && (
                <div className="text-xs text-green-400 bg-green-400/10 rounded-xl px-3 py-2">{variantMsg}</div>
              )}
              {product?.variants.length === 0 ? (
                <p className="text-sm text-neutral-500 text-center py-8">Sin variantes</p>
              ) : (
                product?.variants.map(v => (
                  <VariantEditRow
                    key={v.id}
                    variant={v}
                    productId={productId}
                    defaultCurrency={product.currency}
                    onSave={(req) => {
                      updateVariant(req, {
                        onSuccess: () => { setVariantMsg('Variante guardada.'); setTimeout(() => setVariantMsg(null), 2500) },
                      })
                    }}
                    isSaving={savingVariant}
                  />
                ))
              )}

              {/* Agregar tamaño nuevo */}
              <div className="rounded-xl border border-dashed border-neutral-700 p-4">
                <p className="mb-3 text-xs font-semibold text-gold-400 uppercase tracking-wider">Agregar tamaño</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
                  <input value={newVar.label} onChange={e => setNewVar(s => ({ ...s, label: e.target.value }))} className={inputCls} placeholder="Tamaño (5ml)" />
                  <input value={newVar.sku} onChange={e => setNewVar(s => ({ ...s, sku: e.target.value }))} className={inputCls} placeholder="SKU *" />
                  <input value={newVar.stock} onChange={e => setNewVar(s => ({ ...s, stock: e.target.value }))} type="number" className={inputCls} placeholder="Stock" />
                  <input value={newVar.price} onChange={e => setNewVar(s => ({ ...s, price: e.target.value }))} type="number" step="0.01" className={inputCls} placeholder="Precio" />
                  <input value={newVar.compareAtPrice} onChange={e => setNewVar(s => ({ ...s, compareAtPrice: e.target.value }))} type="number" step="0.01" className={inputCls} placeholder="Tachado" />
                  <input value={newVar.cost} onChange={e => setNewVar(s => ({ ...s, cost: e.target.value }))} type="number" step="0.01" className={inputCls} placeholder="Costo" />
                </div>
                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    disabled={addingVariant || !newVar.sku.trim()}
                    onClick={() => {
                      addVariant({
                        productId,
                        sku: newVar.sku.trim(),
                        attributes: newVar.label.trim() ? { 'Tamaño': newVar.label.trim() } : {},
                        initialStock: Number(newVar.stock) || 0,
                        price: newVar.price ? Number(newVar.price) : undefined,
                        compareAtPrice: newVar.compareAtPrice ? Number(newVar.compareAtPrice) : undefined,
                        cost: newVar.cost ? Number(newVar.cost) : undefined,
                        currency: product?.currency ?? 'ARS',
                        minStockThreshold: 5,
                      }, {
                        onSuccess: () => {
                          setNewVar({ label: '', sku: '', price: '', compareAtPrice: '', cost: '', stock: '0' })
                          setVariantMsg('Tamaño agregado.'); setTimeout(() => setVariantMsg(null), 2500)
                        },
                      })
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-black text-xs font-semibold disabled:opacity-50 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {addingVariant ? 'Agregando…' : 'Agregar tamaño'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Images */}
          {activeTab === 'images' && (
            <ImagesTab productId={productId} images={product?.images ?? []} />
          )}
        </>
      )}
    </ModalShell>
  )
}

function ImagesTab({ productId, images }: { productId: string; images: ProductImage[] }) {
  const { mutate: addImage, isPending: adding } = useAddProductImage()
  const { mutate: removeImage } = useRemoveProductImage()
  const [url, setUrl] = useState('')

  const add = () => {
    const u = url.trim()
    if (!u) return
    addImage({ productId, url: u }, { onSuccess: () => setUrl('') })
  }

  return (
    <div className="p-6 space-y-4">
      <div className="rounded-xl border border-neutral-800 p-4">
        <p className="mb-1 text-xs font-semibold text-gold-400 uppercase tracking-wider">Agregar imagen</p>
        <p className="mb-3 text-[11px] text-neutral-600">
          Pegá el link de una imagen (podés usar el de <b>compartir</b> de Google Drive; se convierte solo).
          La primera imagen es la principal.
        </p>
        <div className="flex gap-2">
          <input
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
            className={inputCls}
            placeholder="https://drive.google.com/file/d/…/view"
          />
          <button
            type="button"
            onClick={add}
            disabled={adding || !url.trim()}
            className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-gold-500 hover:bg-gold-400 text-black px-3 py-1 text-xs font-semibold disabled:opacity-50 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> {adding ? 'Agregando…' : 'Agregar'}
          </button>
        </div>
      </div>

      {images.length === 0 ? (
        <p className="text-sm text-neutral-500 text-center py-8">Este producto no tiene imágenes.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((img, i) => (
            <div key={img.id} className="group relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50">
              <div className="aspect-square">
                <img src={img.url} alt={img.altText ?? ''} className="h-full w-full object-cover" />
              </div>
              {i === 0 && (
                <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold-400">
                  Principal
                </span>
              )}
              <button
                type="button"
                onClick={() => removeImage({ productId, imageId: img.id })}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white/80 opacity-0 transition-all hover:bg-red-500 hover:text-white group-hover:opacity-100"
                title="Eliminar imagen"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function DecantPanel({ product }: { product: Product }) {
  const { mutate: configure, isPending } = useConfigureDecant()
  const [bottleCost, setBottleCost] = useState(product.bottleCost != null ? String(product.bottleCost) : '')
  const [bottleMl, setBottleMl]     = useState(product.bottleMl != null ? String(product.bottleMl) : '')
  const [stockMl, setStockMl]       = useState(String(product.stockMl ?? 0))
  const [reorderMl, setReorderMl]   = useState(String(product.reorderMl ?? 0))

  const bc = Number(bottleCost) || 0
  const bm = Number(bottleMl) || 0
  const costPerMl = bm > 0 ? bc / bm : 0
  const capital = (Number(stockMl) || 0) * costPerMl

  const save = () => configure({
    productId: product.id,
    bottleCost: bottleCost ? Number(bottleCost) : null,
    bottleMl: bottleMl ? Number(bottleMl) : null,
    stockMl: Number(stockMl) || 0,
    reorderMl: Number(reorderMl) || 0,
  })

  return (
    <div className="rounded-xl border border-gold-500/20 bg-gold-500/[0.03] p-4">
      <p className="mb-1 text-xs font-semibold text-gold-400 uppercase tracking-wider">Decant · stock por ml</p>
      <p className="mb-3 text-[11px] text-neutral-500">
        El stock se mide en ml del frasco. Cada venta de 5ml o 10ml descuenta esos ml. El costo sale del frasco (costo ÷ ml).
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className={labelCls}>Costo del frasco</label>
          <input value={bottleCost} onChange={e => setBottleCost(e.target.value)} type="number" step="0.01" className={inputCls} placeholder="Ej. 70000" />
        </div>
        <div>
          <label className={labelCls}>ml del frasco</label>
          <input value={bottleMl} onChange={e => setBottleMl(e.target.value)} type="number" className={inputCls} placeholder="Ej. 100" />
        </div>
        <div>
          <label className={labelCls}>Stock actual (ml)</label>
          <input value={stockMl} onChange={e => setStockMl(e.target.value)} type="number" className={inputCls} placeholder="ml disponibles" />
        </div>
        <div>
          <label className={labelCls}>Avisar a los (ml)</label>
          <input value={reorderMl} onChange={e => setReorderMl(e.target.value)} type="number" className={inputCls} placeholder="Ej. 15" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-neutral-400">
          Costo por ml: <span className="text-white">${costPerMl ? formatCurrency(costPerMl, product.currency) : '—'}</span>
          {' · '}Capital en este decant: <span className="text-emerald-400">${formatCurrency(capital, product.currency)}</span>
        </p>
        <button type="button" onClick={save} disabled={isPending}
          className="rounded-xl bg-gold-500 hover:bg-gold-400 text-black text-xs font-semibold px-4 py-1.5 disabled:opacity-60 transition-colors">
          {isPending ? 'Guardando…' : 'Guardar decant'}
        </button>
      </div>
    </div>
  )
}

function VariantEditRow({
  variant, productId, defaultCurrency, onSave, isSaving,
}: {
  variant: { id: string; sku: string; price: number | null; compareAtPrice?: number | null; cost?: number | null; currency: string; stockQuantity: number; minStockThreshold: number; isActive: boolean; attributes: Record<string, string> }
  productId: string
  defaultCurrency: string
  onSave: (req: UpdateVariantRequest) => void
  isSaving: boolean
}) {
  const form = useForm<VariantEditValues>({
    resolver: zodResolver(variantEditSchema),
    defaultValues: {
      price:             variant.price ?? undefined,
      compareAtPrice:    variant.compareAtPrice ?? undefined,
      cost:              variant.cost ?? undefined,
      currency:          variant.currency || defaultCurrency,
      minStockThreshold: variant.minStockThreshold,
      isActive:          variant.isActive,
    },
  })

  const attrs = Object.entries(variant.attributes).map(([k, v]) => `${k}: ${v}`).join(' / ') || 'Variante única'

  // Ajuste de stock (usa el endpoint de inventario)
  const { mutate: adjustStock, isPending: adjustingStock } = useAdjustStock()
  const [newStock, setNewStock] = useState(String(variant.stockQuantity))

  const onSubmit = (values: VariantEditValues) => {
    onSave({
      productId,
      variantId: variant.id,
      price: values.price ? Number(values.price) : undefined,
      compareAtPrice: values.compareAtPrice ? Number(values.compareAtPrice) : undefined,
      cost: values.cost ? Number(values.cost) : undefined,
      currency: values.currency,
      minStockThreshold: values.minStockThreshold,
      isActive: values.isActive,
    })
  }

  return (
    <div className="rounded-xl border border-neutral-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-white">{attrs}</p>
          <p className="text-xs text-neutral-500">SKU: {variant.sku} · Stock actual: <span className="text-white">{variant.stockQuantity}</span></p>
          {/* Ajuste de stock real */}
          <div className="mt-2 flex items-center gap-2">
            <input
              type="number"
              value={newStock}
              onChange={e => setNewStock(e.target.value)}
              className="w-24 rounded-lg border border-neutral-700 bg-obsidian-800 px-2 py-1 text-xs text-white"
              placeholder="Stock"
            />
            <button
              type="button"
              disabled={adjustingStock || Number(newStock) === variant.stockQuantity}
              onClick={() => adjustStock({ productId, variantId: variant.id, newQuantity: Number(newStock) || 0, reason: 'Ajuste manual de stock' })}
              className="rounded-lg border border-neutral-700 px-2.5 py-1 text-xs text-neutral-300 hover:border-emerald-500/50 hover:text-emerald-400 disabled:opacity-40 transition-colors"
            >
              {adjustingStock ? 'Guardando…' : 'Fijar stock'}
            </button>
          </div>
        </div>
        <Controller control={form.control} name="isActive" render={({ field }) => (
          <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-400">
            <input type="checkbox" className="accent-gold-500" checked={field.value} onChange={field.onChange} />
            Activa
          </label>
        )} />
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3 items-end sm:grid-cols-5">
        <div>
          <label className={labelCls}>Precio (vacío = base)</label>
          <input {...form.register('price')} type="number" step="0.01" className={inputCls} placeholder="Base" />
        </div>
        <div>
          <label className={labelCls}>Precio tachado</label>
          <input {...form.register('compareAtPrice')} type="number" step="0.01" className={inputCls} placeholder="Descuento" />
        </div>
        <div>
          <label className={labelCls}>Costo</label>
          <input {...form.register('cost')} type="number" step="0.01" className={inputCls} placeholder="Costo" />
        </div>
        <div>
          <label className={labelCls}>Moneda</label>
          <select {...form.register('currency')} className={inputCls}>
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Stock mín.</label>
          <input {...form.register('minStockThreshold')} type="number" className={inputCls} />
        </div>
        <div className="col-span-2 flex justify-end sm:col-span-5">
          <button type="submit" disabled={isSaving}
            className="px-4 py-1.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-black text-xs font-semibold disabled:opacity-60 transition-colors">
            {isSaving ? 'Guardando...' : 'Guardar variante'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Modal shell ──────────────────────────────────────────────────────────────

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-neutral-800 shadow-2xl"
        style={{ background: 'var(--surface)' }}>
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <h2 className="font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-obsidian-700 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}

// ─── Status Change Dropdown ───────────────────────────────────────────────────

function StatusMenu({ product, anchorRect, onClose }: { product: ProductListItem; anchorRect: DOMRect; onClose: () => void }) {
  const { mutate: changeStatus, isPending } = useChangeProductStatus()
  const options = [
    { value: 'Draft', label: 'Borrador' },
    { value: 'Published', label: 'Publicado' },
    { value: 'Discontinued', label: 'Discontinuado' },
  ]
  // Posición fija calculada desde el botón: se sale de cualquier overflow de la tabla.
  // Si no hay espacio abajo, abre hacia arriba.
  const MENU_W = 176
  const MENU_H = 120
  const openUp = anchorRect.bottom + MENU_H > window.innerHeight
  const top = openUp ? anchorRect.top - MENU_H - 4 : anchorRect.bottom + 4
  const left = Math.max(8, anchorRect.right - MENU_W)

  return createPortal(
    <>
      <div className="fixed inset-0 z-[60]" onClick={onClose} />
      <div
        className="fixed w-44 rounded-xl border border-neutral-800 shadow-xl z-[61] py-1"
        style={{ background: 'var(--surface)', top, left }}
      >
        {options.filter(o => o.value !== product.status).map((o) => (
          <button key={o.value} disabled={isPending}
            onClick={() => { changeStatus({ id: product.id, status: o.value }); onClose() }}
            className="w-full text-left px-3 py-2 text-sm text-neutral-400 hover:text-white hover:bg-obsidian-800 transition-colors">
            {o.label}
          </button>
        ))}
      </div>
    </>,
    document.body,
  )
}

// ─── Product Row ──────────────────────────────────────────────────────────────

function ProductRow({ product, onEdit }: { product: ProductListItem; onEdit: () => void }) {
  const [menuRect, setMenuRect] = useState<DOMRect | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  return (
    <tr className="border-b border-neutral-800/60 hover:bg-obsidian-800/30 transition-colors group">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl overflow-hidden bg-obsidian-800 shrink-0 flex items-center justify-center border border-neutral-800">
            {product.mainImageUrl
              ? <img src={product.mainImageUrl} alt={product.name} className="h-full w-full object-cover" />
              : <Package className="h-4 w-4 text-neutral-700" />}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate max-w-[180px]">{product.name}</p>
            <p className="text-xs text-neutral-500">{product.sku}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-neutral-400">{product.categoryName ?? '—'}</td>
      <td className="px-4 py-3">
        <p className="text-sm font-medium text-white">{formatCurrency(product.basePrice, product.currency)}</p>
        {product.compareAtPrice && (
          <p className="text-xs text-neutral-500 line-through">{formatCurrency(product.compareAtPrice, product.currency)}</p>
        )}
      </td>
      <td className="px-4 py-3"><StockBadge stock={product.totalStock} /></td>
      <td className="px-4 py-3 text-sm text-neutral-400">{product.variantCount}</td>
      <td className="px-4 py-3"><StatusBadge status={product.status} /></td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 justify-end relative">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-neutral-600 hover:text-white hover:bg-obsidian-700 transition-colors opacity-0 group-hover:opacity-100"
            title="Editar"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <div className="relative">
            <button
              ref={btnRef}
              onClick={() => setMenuRect(r => r ? null : btnRef.current!.getBoundingClientRect())}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-neutral-600 hover:text-white hover:bg-obsidian-700 transition-colors text-xs opacity-0 group-hover:opacity-100"
            >
              Estado <ChevronDown className="h-3 w-3" />
            </button>
            {menuRect && <StatusMenu product={product} anchorRect={menuRect} onClose={() => setMenuRect(null)} />}
          </div>
        </div>
      </td>
    </tr>
  )
}

// ─── Página principal ──────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ProductStatus | ''>('')
  const [categoryId, setCategoryId] = useState('')
  const [page, setPage] = useState(1)
  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const debouncedSearch = useDebounce(search, 350)

  const { data, isLoading } = useProducts({
    page, pageSize: 25,
    search: debouncedSearch || undefined,
    status: status || undefined,
    categoryId: categoryId || undefined,
  })

  const { data: categories } = useCategories()
  const flatCats = categories ? flattenCategories(categories) : []

  const stats = {
    total:     data?.totalCount ?? 0,
    published: data?.items.filter(p => p.status === 'Published').length ?? 0,
    lowStock:  data?.items.filter(p => p.totalStock <= 5).length ?? 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-semibold text-white tracking-wide">Productos</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Gestión del catálogo de fragancias</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-semibold text-sm transition-colors"
        >
          <Plus className="h-4 w-4" /> Nuevo producto
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total productos',        value: stats.total,     icon: Package,       color: 'text-blue-400'   },
          { label: 'Publicados',             value: stats.published, icon: TrendingUp,    color: 'text-green-400'  },
          { label: 'Stock bajo / sin stock', value: stats.lowStock,  icon: AlertTriangle, color: 'text-yellow-400' },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-neutral-800 p-4" style={{ background: 'var(--surface)' }}>
            <div className="flex items-center gap-3">
              <s.icon className={cn('h-5 w-5', s.color)} />
              <div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-neutral-500">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 pointer-events-none" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar por nombre o SKU..."
            className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-obsidian-800 border border-neutral-800 text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-gold-500/50"
          />
        </div>

        <select value={status} onChange={e => { setStatus(e.target.value as ProductStatus | ''); setPage(1) }}
          className="px-3 py-2 rounded-xl text-sm bg-obsidian-800 border border-neutral-800 text-white focus:outline-none focus:ring-1 focus:ring-gold-500/50">
          <option value="">Todos los estados</option>
          <option value="Draft">Borrador</option>
          <option value="Published">Publicado</option>
          <option value="Discontinued">Discontinuado</option>
        </select>

        <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setPage(1) }}
          className="px-3 py-2 rounded-xl text-sm bg-obsidian-800 border border-neutral-800 text-white focus:outline-none focus:ring-1 focus:ring-gold-500/50">
          <option value="">Todas las categorías</option>
          {flatCats.map(c => (
            <option key={c.id} value={c.id}>{'  '.repeat(c.depth)}{c.name}</option>
          ))}
        </select>

        {(search || status || categoryId) && (
          <button onClick={() => { setSearch(''); setStatus(''); setCategoryId(''); setPage(1) }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700 transition-colors">
            <X className="h-3.5 w-3.5" /> Limpiar
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-neutral-800 overflow-hidden" style={{ background: 'var(--surface)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-neutral-800 bg-obsidian-800/50">
                {['Producto', 'Categoría', 'Precio', 'Stock', 'Variantes', 'Estado', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-medium text-neutral-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-neutral-500 text-sm">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />Cargando productos...
                </td></tr>
              ) : !data?.items.length ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-neutral-500">
                  <Package className="h-8 w-8 mx-auto mb-2 text-neutral-700" />
                  No hay productos que coincidan con los filtros.
                </td></tr>
              ) : data.items.map((p) => (
                <ProductRow key={p.id} product={p} onEdit={() => setEditId(p.id)} />
              ))}
            </tbody>
          </table>
        </div>

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-800">
            <p className="text-xs text-neutral-500">
              {data.totalCount} productos · página {data.page} de {data.totalPages}
            </p>
            <div className="flex gap-1">
              <button disabled={!data.hasPreviousPage} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1.5 rounded-lg text-xs border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Anterior
              </button>
              <button disabled={!data.hasNextPage} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1.5 rounded-lg text-xs border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {showCreate && <CreateProductModal onClose={() => setShowCreate(false)} />}
      {editId    && <EditProductModal productId={editId} onClose={() => setEditId(null)} />}
    </div>
  )
}
