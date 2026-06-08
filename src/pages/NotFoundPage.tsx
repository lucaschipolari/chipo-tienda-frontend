import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 p-4 text-center">
      <p className="text-8xl font-bold text-neutral-200 select-none">404</p>
      <h1 className="text-2xl font-bold text-neutral-800 mt-4">Página no encontrada</h1>
      <p className="text-neutral-500 mt-2 mb-8">
        La URL que ingresaste no existe o fue movida.
      </p>
      <Link
        to="/"
        className="px-5 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
