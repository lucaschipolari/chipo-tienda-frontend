import { Link } from 'react-router-dom'
import { Instagram, MessageCircle } from 'lucide-react'

/**
 * StoreFooter — minimalista y elegante.
 * Marca · navegación esencial · contacto humano.
 */

type FooterLink = { label: string; href: string; external?: boolean }

const FOOTER_LINKS: Record<string, FooterLink[]> = {
  explorar: [
    { label: 'Toda la colección', href: '/' },
    { label: 'Favoritos',         href: '/account/favorites' },
  ],
  cuenta: [
    { label: 'Mi perfil',   href: '/account' },
    { label: 'Mis pedidos', href: '/account/orders' },
  ],
  contacto: [
    { label: 'WhatsApp',  href: 'https://wa.me/543813462606', external: true },
    { label: 'Instagram', href: 'https://instagram.com/chipo.ar', external: true },
  ],
}

export function StoreFooter() {
  return (
    <footer className="mt-24 border-t border-white/5">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-5">

          {/* ── Marca ── */}
          <div className="col-span-2">
            <img src="/chipo-logo.svg" alt="Chipo" className="h-12 w-auto" />
            <p className="mt-4 max-w-[240px] text-sm leading-relaxed text-neutral-500">
              La fragancia que cuenta tu historia. Perfumes para personas reales,
              elegidos con criterio y enviados con cuidado.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://instagram.com/chipo.ar"
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram @chipo.ar"
                className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-400 ring-1 ring-white/10 transition-all duration-300 hover:text-white hover:ring-white/35"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://wa.me/543813462606"
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-400 ring-1 ring-white/10 transition-all duration-300 hover:text-white hover:ring-white/35"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* ── Columnas ── */}
          {(
            [
              ['Explorar', FOOTER_LINKS.explorar],
              ['Tu cuenta', FOOTER_LINKS.cuenta],
              ['Contacto', FOOTER_LINKS.contacto],
            ] as const
          ).map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-4 text-[11px] font-medium uppercase tracking-[0.25em] text-neutral-500">
                {title}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a href={link.href} target="_blank" rel="noreferrer" className="text-sm text-neutral-400 transition-colors duration-300 hover:text-white">
                        {link.label}
                      </a>
                    ) : (
                      <Link to={link.href} className="text-sm text-neutral-400 transition-colors duration-300 hover:text-white">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Línea final ── */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
          <p className="text-xs text-neutral-600">
            © {new Date().getFullYear()} Chipo · Tucumán, Argentina
          </p>
          <p className="text-xs text-neutral-600">
            @chipo.ar · 381 346 2606
          </p>
        </div>
      </div>
    </footer>
  )
}
