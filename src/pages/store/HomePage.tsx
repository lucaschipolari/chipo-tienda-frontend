import { useState } from 'react'
import { Search, Loader2, Package, ShieldCheck, Users, Truck, ImageIcon } from 'lucide-react'
import { useProducts } from '@/features/products/hooks/useProducts'
import { useCategories, flattenCategories } from '@/features/categories/hooks/useCategories'
import { useDebounce } from '@/hooks/useDebounce'
import { cn } from '@/utils/helpers/cn'
import { ProductCard } from '@/components/store/ProductCard'
import { Reveal } from '@/components/store/Reveal'

// ─── Sección de confianza / originalidad ───────────────────────────────────────

function TrustSection() {
  return (
    <section className="border-t border-white/5 bg-[#0c0c0c]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Foto (reemplazable) */}
          <Reveal>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-[#141414] ring-1 ring-white/10">
              {/* Placeholder de fondo — visible hasta que subas la foto real */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-neutral-600">
                <ImageIcon className="h-10 w-10" />
                <span className="px-6 text-center text-xs leading-relaxed">
                  Acá va la foto de ustedes trabajando<br />
                  <span className="text-neutral-700">(subila como public/nosotros.jpg)</span>
                </span>
              </div>
              {/* Foto real: si existe /nosotros.jpg la muestra encima del placeholder */}
              <img
                src="/nosotros.jpg"
                alt="El equipo de Chipo"
                className="absolute inset-0 h-full w-full object-cover"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
            </div>
          </Reveal>

          {/* Texto */}
          <div>
            <Reveal>
              <p className="mb-3 text-[11px] uppercase tracking-[0.35em] text-neutral-500">Nuestra promesa</p>
              <h2 className="font-display text-3xl font-medium leading-tight text-white sm:text-4xl">
                Perfumes 100% originales
              </h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-neutral-400">
                Somos dos hermanos apasionados por las fragancias. Elegimos cada perfume a mano
                y te garantizamos que todo lo que vendemos es original, sin excepciones.
                Comprás con la tranquilidad de que atrás hay personas reales que responden.
              </p>
            </Reveal>

            {/* Garantías */}
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { icon: ShieldCheck, title: '100% Originales', desc: 'Cada fragancia, garantizada.' },
                { icon: Users, title: 'Atención personal', desc: 'Te asesoramos por WhatsApp.' },
                { icon: Truck, title: 'Envíos a todo el país', desc: 'Coordinamos con vos.' },
              ].map((b, i) => (
                <Reveal key={b.title} delay={i * 90}>
                  <div className="flex flex-col gap-2 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/5">
                    <b.icon className="h-5 w-5 text-white" />
                    <p className="text-sm font-medium text-white">{b.title}</p>
                    <p className="text-xs leading-relaxed text-neutral-500">{b.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/**
 * HomePage — híbrida estilo Pency: franja de marca corta + buscador central +
 * chips de categorías reales + catálogo comprable, todo en la misma pantalla.
 */

export default function HomePage() {
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const debounced = useDebounce(search, 300)

  const { data: categories } = useCategories()
  const chips = categories ? flattenCategories(categories) : []

  const { data, isLoading } = useProducts({
    page: 1,
    pageSize: 60,
    categoryId: categoryId || undefined,
    search: debounced.trim() || undefined,
    status: 'Published',
  })

  const products = data?.items ?? []

  return (
    <div className="min-h-screen">
      {/* ── Franja de marca + buscador (el único buscador) ── */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(38,38,38,0.85)_0%,transparent_70%)]" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-16">
          <Reveal>
            <p className="mb-3 text-[11px] uppercase tracking-[0.4em] text-neutral-400">
              Chipo · Fragancias
            </p>
            <h1 className="font-display text-3xl font-medium leading-tight tracking-tight text-white sm:text-5xl">
              La fragancia que cuenta tu historia
            </h1>
          </Reveal>

          {/* Buscador */}
          <Reveal delay={120}>
            <div className="relative mx-auto mt-7 max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar tu perfume…"
                className="w-full rounded-full bg-white/[0.06] py-3 pl-11 pr-4 text-sm text-white ring-1 ring-white/15 placeholder:text-neutral-500 transition-all focus:outline-none focus:ring-white/35"
              />
            </div>
          </Reveal>

          {/* Opciones / categorías debajo del buscador */}
          <Reveal delay={220}>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setCategoryId('')}
                className={cn(
                  'rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-wide ring-1 transition-all duration-300',
                  !categoryId ? 'bg-white text-black ring-white' : 'text-neutral-300 ring-white/15 hover:text-white hover:ring-white/40',
                )}
              >
                Todo
              </button>
              {chips.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id === categoryId ? '' : cat.id)}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-xs font-medium uppercase tracking-wide ring-1 transition-all duration-300',
                    cat.id === categoryId ? 'bg-white text-black ring-white' : 'text-neutral-300 ring-white/15 hover:text-white hover:ring-white/40',
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Catálogo comprable ── */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {isLoading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="h-7 w-7 animate-spin text-neutral-600" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Package className="mb-4 h-12 w-12 text-neutral-700" />
            <p className="text-lg font-medium text-white">No encontramos esa fragancia</p>
            <p className="mt-1 text-sm text-neutral-500">Probá con otra búsqueda o mirá toda la colección.</p>
            {(search || categoryId) && (
              <button
                onClick={() => { setSearch(''); setCategoryId('') }}
                className="mt-6 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-neutral-200"
              >
                Ver todo
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {products.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 60}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* ── Confianza / originalidad ── */}
      <TrustSection />
    </div>
  )
}
