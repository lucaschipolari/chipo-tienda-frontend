import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Truck, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button }   from '@/components/ui/Button/Button'
import { Input }    from '@/components/ui/Input/Input'
import { Textarea } from '@/components/ui/Textarea/Textarea'
import {
  useCreateSupplier,
  useUpdateSupplier,
  useSupplier,
} from '@/features/suppliers/hooks/useSuppliers'
import type { CreateSupplierRequest, UpdateSupplierRequest } from '@/types/supplier.types'

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  companyName:  string
  tradeName:    string
  taxId:        string
  email:        string
  phone:        string
  website:      string
  paymentTerms: string
  city:         string
  province:     string
  country:      string
  notes:        string
}

const INITIAL: FormState = {
  companyName:  '',
  tradeName:    '',
  taxId:        '',
  email:        '',
  phone:        '',
  website:      '',
  paymentTerms: '',
  city:         '',
  province:     '',
  country:      '',
  notes:        '',
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function field(label: string, required = false) {
  return (
    <label className="block text-xs font-medium text-neutral-400 mb-1">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NewSupplierPage() {
  const navigate    = useNavigate()
  const { id }      = useParams<{ id: string }>()
  const isEdit      = !!id

  const { data: existing, isLoading: loadingExisting } = useSupplier(id)
  const createMutation = useCreateSupplier()
  const updateMutation = useUpdateSupplier()

  const [form, setForm]     = useState<FormState>(INITIAL)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  // ── Load existing data when editing ──────────────────────────────────────

  useEffect(() => {
    if (existing) {
      setForm({
        companyName:  existing.companyName,
        tradeName:    existing.tradeName    ?? '',
        taxId:        existing.taxId        ?? '',
        email:        existing.email        ?? '',
        phone:        existing.phone        ?? '',
        website:      existing.website      ?? '',
        paymentTerms: existing.paymentTerms ?? '',
        city:         existing.city         ?? '',
        province:     existing.province     ?? '',
        country:      existing.country      ?? '',
        notes:        existing.notes        ?? '',
      })
    }
  }, [existing])

  // ── Helpers ───────────────────────────────────────────────────────────────

  const set = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm(f => ({ ...f, [key]: e.target.value }))
    if (errors[key]) setErrors(er => ({ ...er, [key]: undefined }))
  }

  // ── Validation ────────────────────────────────────────────────────────────

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {}
    if (!form.companyName.trim()) errs.companyName = 'La razón social es requerida.'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Formato de email inválido.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const payload: CreateSupplierRequest = {
      companyName:  form.companyName.trim(),
      tradeName:    form.tradeName.trim()    || undefined,
      taxId:        form.taxId.trim()        || undefined,
      email:        form.email.trim()        || undefined,
      phone:        form.phone.trim()        || undefined,
      website:      form.website.trim()      || undefined,
      paymentTerms: form.paymentTerms.trim() || undefined,
      city:         form.city.trim()         || undefined,
      province:     form.province.trim()     || undefined,
      country:      form.country.trim()      || undefined,
      notes:        form.notes.trim()        || undefined,
    }

    if (isEdit && id) {
      const req: UpdateSupplierRequest = { ...payload, id }
      updateMutation.mutate(
        { id, data: req },
        {
          onSuccess: () => {
            toast.success(`Proveedor "${form.companyName}" actualizado correctamente.`)
            navigate('/admin/suppliers')
          },
          onError: (err: any) => {
            const msg =
              err?.response?.data?.detail ||
              err?.response?.data?.title  ||
              err?.message                ||
              'Error al actualizar el proveedor.'
            toast.error(msg)
          },
        }
      )
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success(`Proveedor "${form.companyName}" creado correctamente.`)
          navigate('/admin/suppliers')
        },
        onError: (err: any) => {
          const msg =
            err?.response?.data?.detail ||
            err?.response?.data?.title  ||
            err?.message                ||
            'Error al crear el proveedor.'
          toast.error(msg)
        },
      })
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  // ── Loading skeleton while fetching existing data ─────────────────────────

  if (isEdit && loadingExisting) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-neutral-800 rounded-xl animate-pulse" />
        <div className="rounded-2xl border border-neutral-800 p-5 space-y-4" style={{ background: 'var(--surface)' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-neutral-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Link
          to="/admin/suppliers"
          className="p-2 rounded-xl hover:bg-obsidian-800 text-neutral-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Truck className="h-5 w-5 text-gold-400" />
            {isEdit ? 'Editar proveedor' : 'Nuevo proveedor'}
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {isEdit
              ? 'Modifica los datos del proveedor.'
              : 'Completa los datos del proveedor para registrarlo en el sistema.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Datos del proveedor ── */}
        <section
          className="rounded-2xl border border-neutral-800 p-5 space-y-4"
          style={{ background: 'var(--surface)' }}
        >
          <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">
            Datos del proveedor
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              {field('Razón Social', true)}
              <Input
                value={form.companyName}
                onChange={set('companyName')}
                placeholder="Ej: Distribuidora El Sol S.A."
                error={errors.companyName}
                fullWidth
              />
            </div>
            <div>
              {field('Nombre Comercial')}
              <Input
                value={form.tradeName}
                onChange={set('tradeName')}
                placeholder="Ej: El Sol"
                fullWidth
              />
            </div>
          </div>

          <div>
            {field('CUIT / Tax ID')}
            <Input
              value={form.taxId}
              onChange={set('taxId')}
              placeholder="Ej: 20-12345678-9"
              fullWidth
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              {field('Email')}
              <Input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="proveedor@empresa.com"
                error={errors.email}
                fullWidth
              />
            </div>
            <div>
              {field('Teléfono')}
              <Input
                value={form.phone}
                onChange={set('phone')}
                placeholder="+54 11 1234-5678"
                fullWidth
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              {field('Sitio web')}
              <Input
                value={form.website}
                onChange={set('website')}
                placeholder="https://www.empresa.com"
                fullWidth
              />
            </div>
            <div>
              {field('Términos de pago')}
              <Input
                value={form.paymentTerms}
                onChange={set('paymentTerms')}
                placeholder="Ej: 30 días, contado, etc."
                fullWidth
              />
            </div>
          </div>
        </section>

        {/* ── Ubicación ── */}
        <section
          className="rounded-2xl border border-neutral-800 p-5 space-y-4"
          style={{ background: 'var(--surface)' }}
        >
          <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">
            Ubicación <span className="text-neutral-600 font-normal normal-case">(opcional)</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              {field('Ciudad')}
              <Input
                value={form.city}
                onChange={set('city')}
                placeholder="Ej: Buenos Aires"
                fullWidth
              />
            </div>
            <div>
              {field('Provincia')}
              <Input
                value={form.province}
                onChange={set('province')}
                placeholder="Ej: Buenos Aires"
                fullWidth
              />
            </div>
            <div>
              {field('País')}
              <Input
                value={form.country}
                onChange={set('country')}
                placeholder="Ej: Argentina"
                fullWidth
              />
            </div>
          </div>
        </section>

        {/* ── Notas ── */}
        <section
          className="rounded-2xl border border-neutral-800 p-5 space-y-4"
          style={{ background: 'var(--surface)' }}
        >
          <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">
            Notas internas <span className="text-neutral-600 font-normal normal-case">(opcional)</span>
          </h2>
          <Textarea
            value={form.notes}
            onChange={set('notes')}
            placeholder="Observaciones, condiciones especiales, historial de negociación..."
            rows={3}
            fullWidth
          />
        </section>

        {/* ── Acciones ── */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Link to="/admin/suppliers">
            <Button variant="ghost" type="button">
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            isLoading={isPending}
            leftIcon={<Save className="h-4 w-4" />}
          >
            {isEdit ? 'Guardar cambios' : 'Guardar proveedor'}
          </Button>
        </div>

      </form>
    </div>
  )
}
