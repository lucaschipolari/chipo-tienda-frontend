import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, UserPlus, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button }   from '@/components/ui/Button/Button'
import { Input }    from '@/components/ui/Input/Input'
import { Select }   from '@/components/ui/Select/Select'
import { Textarea } from '@/components/ui/Textarea/Textarea'
import { useCreateCustomer } from '@/features/customers/hooks/useCustomers'
import type { CreateCustomerRequest, DocumentType, CustomerType } from '@/types/customer.types'

// ─── Opciones de selects ──────────────────────────────────────────────────────

const DOC_TYPE_OPTIONS = [
  { value: 'DNI',       label: 'DNI — Documento Nacional de Identidad' },
  { value: 'RUC',       label: 'RUC — Registro Único de Contribuyente' },
  { value: 'CE',        label: 'CE — Carné de Extranjería' },
  { value: 'Pasaporte', label: 'Pasaporte' },
]

const CUSTOMER_TYPE_OPTIONS = [
  { value: 'Retail',     label: 'Retail — Cliente final' },
  { value: 'Wholesale',  label: 'Mayorista' },
]

// ─── Estado inicial del formulario ───────────────────────────────────────────

interface FormState {
  firstName:    string
  lastName:     string
  documentType: DocumentType
  documentNumber: string
  email:        string
  phoneNumber:  string
  customerType: CustomerType
  street:       string
  city:         string
  province:     string
  postalCode:   string
  notes:        string
}

const INITIAL: FormState = {
  firstName:      '',
  lastName:       '',
  documentType:   'DNI',
  documentNumber: '',
  email:          '',
  phoneNumber:    '',
  customerType:   'Retail',
  street:         '',
  city:           '',
  province:       '',
  postalCode:     '',
  notes:          '',
}

// ─── Utilidad ─────────────────────────────────────────────────────────────────

function field(label: string, required = false) {
  return (
    <label className="block text-xs font-medium text-neutral-400 mb-1">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function NewCustomerPage() {
  const navigate = useNavigate()
  const createMutation = useCreateCustomer()

  const [form, setForm] = useState<FormState>(INITIAL)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  // ── Helpers ──────────────────────────────────────────────────────────────

  const set = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm(f => ({ ...f, [key]: e.target.value }))
    if (errors[key]) setErrors(er => ({ ...er, [key]: undefined }))
  }

  // ── Validación local ──────────────────────────────────────────────────────

  function validate(): boolean {
    const errs: Partial<Record<keyof FormState, string>> = {}
    if (!form.firstName.trim())     errs.firstName     = 'El nombre es requerido.'
    if (!form.lastName.trim())      errs.lastName      = 'El apellido es requerido.'
    if (!form.documentNumber.trim()) errs.documentNumber = 'El número de documento es requerido.'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Formato de email inválido.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const req: CreateCustomerRequest = {
      firstName:      form.firstName.trim(),
      lastName:       form.lastName.trim(),
      documentType:   form.documentType,
      documentNumber: form.documentNumber.trim(),
      email:          form.email.trim() || undefined,
      phoneNumber:    form.phoneNumber.trim() || undefined,
      customerType:   form.customerType,
      street:         form.street.trim()     || undefined,
      city:           form.city.trim()       || undefined,
      province:       form.province.trim()   || undefined,
      postalCode:     form.postalCode.trim() || undefined,
      notes:          form.notes.trim()      || undefined,
    }

    createMutation.mutate(req, {
      onSuccess: (newId) => {
        toast.success(`Cliente "${form.firstName} ${form.lastName}" creado correctamente.`)
        navigate(`/admin/customers`)
      },
      onError: (err: any) => {
        const msg =
          err?.response?.data?.detail ||
          err?.response?.data?.title  ||
          err?.message                ||
          'Error al crear el cliente.'
        toast.error(msg)
      },
    })
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Link
          to="/admin/customers"
          className="p-2 rounded-xl hover:bg-obsidian-800 text-neutral-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-gold-400" />
            Nuevo cliente
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Completa los datos del cliente para registrarlo en el sistema.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ── Datos personales ── */}
        <section className="rounded-2xl border border-neutral-800 p-5 space-y-4" style={{ background: 'var(--surface)' }}>
          <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">
            Datos personales
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              {field('Nombre', true)}
              <Input
                value={form.firstName}
                onChange={set('firstName')}
                placeholder="Ej: Juan"
                error={errors.firstName}
                fullWidth
              />
            </div>
            <div>
              {field('Apellido', true)}
              <Input
                value={form.lastName}
                onChange={set('lastName')}
                placeholder="Ej: Pérez"
                error={errors.lastName}
                fullWidth
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              {field('Tipo de documento', true)}
              <Select
                value={form.documentType}
                onChange={set('documentType')}
                options={DOC_TYPE_OPTIONS}
                fullWidth
              />
            </div>
            <div>
              {field('Número de documento', true)}
              <Input
                value={form.documentNumber}
                onChange={set('documentNumber')}
                placeholder={form.documentType === 'DNI' ? '12345678' : form.documentType === 'RUC' ? '20123456789' : ''}
                error={errors.documentNumber}
                fullWidth
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              {field('Email')}
              <Input
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="cliente@email.com"
                error={errors.email}
                fullWidth
              />
            </div>
            <div>
              {field('Teléfono')}
              <Input
                value={form.phoneNumber}
                onChange={set('phoneNumber')}
                placeholder="+51 999 999 999"
                fullWidth
              />
            </div>
          </div>

          <div>
            {field('Tipo de cliente')}
            <Select
              value={form.customerType}
              onChange={set('customerType')}
              options={CUSTOMER_TYPE_OPTIONS}
              fullWidth
            />
          </div>
        </section>

        {/* ── Dirección ── */}
        <section className="rounded-2xl border border-neutral-800 p-5 space-y-4" style={{ background: 'var(--surface)' }}>
          <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">
            Dirección <span className="text-neutral-600 font-normal normal-case">(opcional)</span>
          </h2>

          <div>
            {field('Calle / Dirección')}
            <Input
              value={form.street}
              onChange={set('street')}
              placeholder="Jr. Los Pinos 123, Miraflores"
              fullWidth
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              {field('Ciudad')}
              <Input
                value={form.city}
                onChange={set('city')}
                placeholder="Lima"
                fullWidth
              />
            </div>
            <div>
              {field('Provincia')}
              <Input
                value={form.province}
                onChange={set('province')}
                placeholder="Lima"
                fullWidth
              />
            </div>
            <div>
              {field('Código postal')}
              <Input
                value={form.postalCode}
                onChange={set('postalCode')}
                placeholder="15074"
                fullWidth
              />
            </div>
          </div>
        </section>

        {/* ── Notas ── */}
        <section className="rounded-2xl border border-neutral-800 p-5 space-y-4" style={{ background: 'var(--surface)' }}>
          <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">
            Notas internas <span className="text-neutral-600 font-normal normal-case">(opcional)</span>
          </h2>
          <Textarea
            value={form.notes}
            onChange={set('notes')}
            placeholder="Observaciones, preferencias, historial especial..."
            rows={3}
            fullWidth
          />
        </section>

        {/* ── Acciones ── */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Link to="/admin/customers">
            <Button variant="ghost" type="button">
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            isLoading={createMutation.isPending}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Guardar cliente
          </Button>
        </div>

      </form>
    </div>
  )
}
