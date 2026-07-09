import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User, Mail, Phone, Shield, ShoppingBag,
  Heart, KeyRound, Eye, EyeOff, CheckCircle2, ChevronRight,
} from 'lucide-react'
import { cn } from '@/utils/helpers/cn'
import { useAuthStore } from '@/store/authStore'
import { useChangePassword } from '@/features/auth/hooks/useChangePassword'
import { useLogout } from '@/features/auth/hooks/useLogout'
import { getInitials } from '@/utils/formatters/text'

// ─── Schema cambio de contraseña ─────────────────────────────────────────────

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Requerida'),
    newPassword: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmPassword: z.string().min(1, 'Requerida'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

type ChangePasswordValues = z.infer<typeof changePasswordSchema>

// ─── Sección de cambio de contraseña ─────────────────────────────────────────

function ChangePasswordSection() {
  const [open, setOpen] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const { mutate: changePassword, isPending } = useChangePassword()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
  })

  const newPwd = watch('newPassword', '')

  const onSubmit = (values: ChangePasswordValues) => {
    changePassword(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        onSuccess: () => {
          reset()
          setOpen(false)
        },
      },
    )
  }

  const inputBase = cn(
    'w-full rounded-xl text-sm bg-neutral-900 border text-white',
    'placeholder:text-neutral-600',
    'focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500/50',
    'transition-all pl-4 pr-10 py-2.5',
  )

  return (
    <div className="rounded-2xl border border-neutral-800 overflow-hidden" style={{ background: 'var(--surface)' }}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-neutral-800/40 transition-colors"
      >
        <div className="flex items-center gap-3">
          <KeyRound className="h-4 w-4 text-neutral-500" />
          <span className="text-sm font-medium text-white">Cambiar contraseña</span>
        </div>
        <ChevronRight className={cn('h-4 w-4 text-neutral-600 transition-transform', open && 'rotate-90')} />
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-neutral-800">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4" noValidate>

            {/* Contraseña actual */}
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Contraseña actual</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('currentPassword')}
                  className={cn(inputBase, errors.currentPassword ? 'border-red-500/60' : 'border-neutral-800')}
                />
                <button type="button" onClick={() => setShowCurrent((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400 transition-colors">
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.currentPassword && <p className="mt-1 text-xs text-red-400">{errors.currentPassword.message}</p>}
            </div>

            {/* Nueva contraseña */}
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Nueva contraseña</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  {...register('newPassword')}
                  className={cn(inputBase, errors.newPassword ? 'border-red-500/60' : 'border-neutral-800')}
                />
                <button type="button" onClick={() => setShowNew((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400 transition-colors">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && <p className="mt-1 text-xs text-red-400">{errors.newPassword.message}</p>}
              {/* Indicador de fortaleza */}
              {newPwd && (
                <ul className="mt-2 space-y-1">
                  {[
                    { ok: newPwd.length >= 8,  label: 'Mínimo 8 caracteres' },
                    { ok: /[A-Z]/.test(newPwd), label: 'Una mayúscula' },
                    { ok: /[0-9]/.test(newPwd), label: 'Un número' },
                  ].map(({ ok, label }) => (
                    <li key={label} className={cn('flex items-center gap-1.5 text-xs', ok ? 'text-green-400' : 'text-neutral-600')}>
                      <CheckCircle2 className={cn('h-3 w-3 shrink-0', ok ? 'text-green-400' : 'text-neutral-700')} />
                      {label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Confirmar */}
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1.5">Confirmá la nueva contraseña</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                  className={cn(inputBase, errors.confirmPassword ? 'border-red-500/60' : 'border-neutral-800')}
                />
                <button type="button" onClick={() => setShowConfirm((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400 transition-colors">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-400">{errors.confirmPassword.message}</p>}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => { reset(); setOpen(false) }}
                className="flex-1 h-9 rounded-xl text-sm font-medium text-neutral-400 border border-neutral-700 hover:border-neutral-500 hover:text-white transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 h-9 rounded-xl text-sm font-medium bg-gold-500 text-black hover:bg-gold-400 transition-all disabled:opacity-60"
              >
                {isPending ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function AccountPage() {
  const user = useAuthStore((s) => s.user)
  const { logout, isLoggingOut } = useLogout()

  if (!user) return null

  const quickLinks = [
    { icon: ShoppingBag, label: 'Mis pedidos',    href: '/account/orders',    desc: 'Historial de compras' },
    { icon: Heart,       label: 'Mis favoritos',  href: '/account/favorites', desc: 'Productos guardados' },
  ]

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--bg)' }}
    >
      <div className="max-w-lg mx-auto px-4 py-10 space-y-6">

        {/* ── Avatar + nombre ── */}
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="h-20 w-20 rounded-full bg-gold-500 text-black text-2xl font-bold flex items-center justify-center shadow-gold">
            {getInitials(user.fullName)}
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold text-white">{user.fullName}</h1>
            <p className="text-sm text-neutral-500 mt-0.5">{user.email}</p>
          </div>
          {/* Badges de roles */}
          {user.roles.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-center">
              {user.roles.map((r) => (
                <span
                  key={r}
                  className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gold-500/10 text-gold-400 border border-gold-500/20"
                >
                  {r}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Info personal ── */}
        <div className="rounded-2xl border border-neutral-800 overflow-hidden" style={{ background: 'var(--surface)' }}>
          <div className="px-5 py-3.5 border-b border-neutral-800">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Información personal
            </h2>
          </div>

          <div className="divide-y divide-neutral-800/60">
            <InfoRow icon={User}  label="Nombre completo" value={user.fullName} />
            <InfoRow icon={Mail}  label="Correo electrónico" value={user.email} />
            <InfoRow icon={Phone} label="Teléfono" value="—" />
            <InfoRow icon={Shield} label="Roles" value={user.roles.join(', ') || '—'} />
          </div>
        </div>

        {/* ── Accesos rápidos ── */}
        <div className="rounded-2xl border border-neutral-800 overflow-hidden" style={{ background: 'var(--surface)' }}>
          <div className="px-5 py-3.5 border-b border-neutral-800">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Mi cuenta
            </h2>
          </div>
          <div className="divide-y divide-neutral-800/60">
            {quickLinks.map(({ icon: Icon, label, href, desc }) => (
              <Link
                key={href}
                to={href}
                className="flex items-center gap-4 px-5 py-4 hover:bg-neutral-800/40 transition-colors group"
              >
                <div className="h-9 w-9 rounded-xl bg-neutral-800 flex items-center justify-center shrink-0 group-hover:bg-gold-500/10 transition-colors">
                  <Icon className="h-4 w-4 text-neutral-500 group-hover:text-gold-400 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-neutral-500">{desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-700 group-hover:text-neutral-400 transition-colors shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* ── Seguridad ── */}
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-3 px-1">
            Seguridad
          </h2>
          <ChangePasswordSection />
        </div>

        {/* ── Cerrar sesión ── */}
        <div className="pt-2">
          <button
            onClick={() => logout()}
            disabled={isLoggingOut}
            className={cn(
              'w-full h-11 rounded-xl text-sm font-medium',
              'border border-neutral-800 text-neutral-400',
              'hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/5',
              'transition-all disabled:opacity-50',
            )}
          >
            {isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
          </button>
        </div>

      </div>
    </div>
  )
}

// ─── Fila de info ─────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5">
      <Icon className="h-4 w-4 text-neutral-600 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-neutral-500">{label}</p>
        <p className="text-sm text-white truncate">{value}</p>
      </div>
    </div>
  )
}
