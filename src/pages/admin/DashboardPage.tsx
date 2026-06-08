/**
 * DashboardPage — Placeholder.
 * Se implementa en la Etapa 3 del roadmap.
 */
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Dashboard</h1>
        <p className="text-neutral-500 mt-1">Vista ejecutiva del negocio</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {['Ventas hoy', 'Pedidos activos', 'Stock bajo', 'Clientes nuevos'].map((label) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-xs border border-neutral-200">
            <p className="text-sm text-neutral-500">{label}</p>
            <p className="text-3xl font-bold text-neutral-800 mt-1">—</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl p-5 shadow-xs border border-neutral-200">
        <p className="text-sm font-medium text-neutral-500 text-center py-12">
          Módulo Dashboard — En desarrollo 🚧
        </p>
      </div>
    </div>
  )
}
