import { Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@/utils/helpers/cn'
import { useLogin } from '@/features/auth/hooks/useLogin'

// ─── Schema ───────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email:    z.string().min(1, 'El email es requerido').email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

type LoginFormValues = z.infer<typeof loginSchema>

// ─── Componente ───────────────────────────────────────────────────────────────

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const { mutate: login, isPending } = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (values: LoginFormValues) => {
    login(values)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg)' }}
    >
      {/* Glow de fondo */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gold-500/5 rounded-full blur-[120px]" />
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
        <div className="text-center mb-10">
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
          <h1 className="text-lg font-semibold text-white mb-1">Bienvenido</h1>
          <p className="text-sm text-neutral-500 mb-7">Ingresá a tu cuenta para continuar</p>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-2 tracking-wide">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 pointer-events-none" />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  {...register('email')}
                  className={cn(
                    'w-full pl-10 pr-4 py-2.5 rounded-xl text-sm',
                    'bg-obsidian-900 border text-white',
                    'placeholder:text-neutral-700',
                    'focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500/50',
                    'transition-all',
                    errors.email
                      ? 'border-red-500/60'
                      : 'border-neutral-800',
                  )}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-2 tracking-wide">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-600 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={cn(
                    'w-full pl-10 pr-10 py-2.5 rounded-xl text-sm',
                    'bg-obsidian-900 border text-white',
                    'placeholder:text-neutral-700',
                    'focus:outline-none focus:ring-2 focus:ring-gold-500/30 focus:border-gold-500/50',
                    'transition-all',
                    errors.password
                      ? 'border-red-500/60'
                      : 'border-neutral-800',
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400 transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* ¿Olvidaste tu contraseña? */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs text-neutral-500 hover:text-gold-400 transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className={cn(
                'w-full h-11 rounded-xl font-medium text-sm',
                'bg-gold-500 text-black',
                'hover:bg-gold-400 active:scale-[0.99]',
                'transition-all shadow-gold hover:shadow-gold-lg',
                'disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100',
              )}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                  Iniciando sesión...
                </span>
              ) : (
                'Iniciar sesión'
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
            ¿No tenés cuenta?{' '}
            <Link to="/register" className="text-gold-400 hover:text-gold-300 font-medium transition-colors">
              Registrate
            </Link>
          </p>
        </div>


      </div>
    </div>
  )
}
