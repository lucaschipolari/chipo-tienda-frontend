import { Outlet, Link } from 'react-router-dom'

/**
 * AuthLayout — Shell minimalista para Login, Register, etc.
 * Sin navegación, centrado vertical y horizontalmente.
 */
export function AuthLayout() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <Link to="/" className="mb-8 text-3xl font-bold text-primary-600">
        Chipo
      </Link>

      {/* Contenido de la ruta */}
      <div className="w-full max-w-md">
        <Outlet />
      </div>

      {/* Footer mínimo */}
      <p className="mt-8 text-xs text-neutral-400">
        © {new Date().getFullYear()} Chipo
      </p>
    </div>
  )
}
