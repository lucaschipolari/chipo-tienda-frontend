import { Link, useNavigate } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'

export default function UnauthorizedPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-4 text-center">
      <ShieldOff className="h-16 w-16 text-neutral-300 mb-4" />
      <h1 className="text-2xl font-bold text-neutral-800">Acceso denegado</h1>
      <p className="text-neutral-500 mt-2 mb-8">
        No tenés los permisos necesarios para ver esta página.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 bg-neutral-200 text-neutral-700 font-medium rounded-lg hover:bg-neutral-300 transition-colors"
        >
          Volver
        </button>
        <Link
          to="/"
          className="px-5 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  )
}
