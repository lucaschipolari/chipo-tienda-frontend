import { Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, User, Phone, CheckCircle2, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@/utils/helpers/cn'
import { useRegister } from '@/features/auth/hooks/useRegister'

// ─── Schema ───────────────────────────────────────────────────────────────────

const registerSchema = z
  .object({
    firstName:   z.string().min(1, 'El nombre es requerido').max(100),
    lastName:    z.string().min(1, 'El apellido es requerido').max(100),
    email:       z.string().min(1, 'El email es requerido').email('Email inválido'),
    phoneNumber: z.string().optional(),
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmPassword: z.string().min(1, 'Confirmá tu contraseña'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

type RegisterFormValues = z.infer<typeof registerSchema>

// ─── Indicador de fortaleza de contraseña ─────────────────────────────────────

function PasswordStrength({ value }: { value: string }) {
  const checks = [
    { label: 'Mínimo 8 caracteres', ok: value.length >= 8 },
    { label: 'Una mayúscula',        ok: /[A-Z]/.test(value) },
    { label: 'Un número',            ok: /[0-9]/.test(value) },
  ]

  if (!value) return null

  return (
    <ul className="mt-2 space-y-1">
      {checks.map(({ label, ok }) => (
        <li key={label} className={cn('flex items-center gap-1.5 text-xs transition-colors', ok ? 'text-success-400' : 'text-neutral-600')}>
          <CheckCircle2 className={cn('h-3 w-3 shrink-0', ok ? 'text-success-400' : 'text-neutral-700')} />
          {label}
        </li>
      ))}
    </ul>
  )
}

// ─── Campo con ícono ──────────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-neutral-400 mb-2 tracking-wide">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm]   = useState(false)
  const { mutate: register, isPending }  = useRegister()

  const {
    register: reg,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  })

  const passwordValue = watch('password', '')

  const onSubmit = (values: RegisterFormValues) => {
    const { confirmPassword: _, ...payload } = values
    register({
      ...payload,
      phoneNumber: payload.phoneNumber || undefined,
    })
  }

  const inputBase = cn(
    'w-full rounded-xl text-sm bg-obsidian-900 border text-white',
    'placeholder:text-neutral-700',
    'focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500/50',
    'transition-all',
  )

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'var(--bg)' }}
    >
      {/* Glow de fondo */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-sm relative z-10">
        {/* ── Volver a la tienda ── */}
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la tienda
        </Link>

        {/* ── Logo ── */}
        <div className="text-center mb-8">
          <Link to="/">
            <img src="/chipo-logo.svg" alt="Chipo" className="mx-auto h-16 w-auto" />
          </Link>
          <div className="mt-3 mx-auto h-px w-10 bg-gradient-to-r from-transparent via-white/60 to-transparent" />
        </div>

        {/* ── Card ── */}
        <div
          className="rounded-2xl border border-neutral-800 p-8"
          style={{ background: 'var(--surface)' }}
        >
          <h1 className="text-lg font-semibold text-white mb-1">Crear cuenta</h1>
          <p className="text-sm text-neutral-500 mb-7">Completá tus datos para registrarte</p>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>

            {/* Nombre + Apellido */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nombre" error={errors.firstName?.message}>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 pointer-events-none" />
                  <input
                    type="text"
                    autoComplete="given-name"
                    placeholder="Juan"
                    {...reg('firstName')}
                    className={cn(inputBase, 'pl-10 pr-4 py-2.5', errors.firstName ? 'border-red-500/60' : 'border-neutral-800')}
                  />
                </div>
              </Field>

              <Field label="Apellido" error={errors.lastName?.message}>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 pointer-events-none" />
                  <input
                    type="text"
                    autoComplete="family-name"
                    placeholder="Pérez"
                    {...reg('lastName')}
                    className={cn(inputBase, 'pl-10 pr-4 py-2.5', errors.lastName ? 'border-red-500/60' : 'border-neutral-800')}
                  />
                </div>
              </Field>
            </div>

            {/* Email */}
            <Field label="Correo electrónico" error={errors.email?.message}>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 pointer-events-none" />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  {...reg('email')}
                  className={cn(inputBase, 'pl-10 pr-4 py-2.5', errors.email ? 'border-red-500/60' : 'border-neutral-800')}
                />
              </div>
            </Field>

            {/* Teléfono (opcional) */}
            <Field label="Teléfono (opcional)" error={errors.phoneNumber?.message}>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 pointer-events-none" />
                <input
                  type="tel"
                  autoComplete="tel"
                  placeholder="+54 9 11 1234-5678"
                  {...reg('phoneNumber')}
                  className={cn(inputBase, 'pl-10 pr-4 py-2.5 border-neutral-800')}
                />
              </div>
            </Field>

            {/* Contraseña */}
            <Field label="Contraseña" error={errors.password?.message}>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  {...reg('password')}
                  className={cn(inputBase, 'pl-10 pr-10 py-2.5', errors.password ? 'border-red-500/60' : 'border-neutral-800')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400 transition-colors"
                  aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <PasswordStrength value={passwordValue} />
            </Field>

            {/* Confirmar contraseña */}
            <Field label="Confirmá la contraseña" error={errors.confirmPassword?.message}>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 pointer-events-none" />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...reg('confirmPassword')}
                  className={cn(inputBase, 'pl-10 pr-10 py-2.5', errors.confirmPassword ? 'border-red-500/60' : 'border-neutral-800')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400 transition-colors"
                  aria-label={showConfirm ? 'Ocultar' : 'Mostrar'}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                'w-full h-11 rounded-xl font-medium text-sm mt-2',
                'bg-gold-500 text-black',
                'hover:bg-gold-400 active:scale-[0.99]',
                'transition-all shadow-gold hover:shadow-gold-lg',
                'disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100',
              )}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                  Creando cuenta...
                </span>
              ) : (
                'Crear cuenta'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-neutral-800" />
            <span className="text-xs text-neutral-600">o</span>
            <div className="flex-1 h-px bg-neutral-800" />
          </div>

          <p className="text-center text-sm text-neutral-500">
            ¿Ya tenés cuenta?{' '}
            <Link
              to="/login"
              className="text-gold-400 hover:text-gold-300 font-medium transition-colors"
            >
              Iniciá sesión
            </Link>
          </p>
        </div>

        {/* Términos */}
        <p className="text-center mt-5 text-xs text-neutral-700 px-4">
          Al registrarte aceptás los{' '}
          <span className="text-neutral-500">Términos de uso</span> y la{' '}
          <span className="text-neutral-500">Política de privacidad</span>.
        </p>
      </div>
    </div>
  )
}
