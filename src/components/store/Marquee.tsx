/**
 * Marquee — cartelera con texto en movimiento (info de la tienda).
 * Se ubica entre el nav y el contenido. Respeta "reduce motion".
 */
const MESSAGES = [
  'Perfumes 100% originales',
  'Árabes · Diseñador · Nicho',
  'Sellados y Decants',
  'Envíos a todo el país',
  'Atención personal por WhatsApp',
]

export function Marquee() {
  // Duplicamos la lista para un loop continuo sin cortes.
  const items = [...MESSAGES, ...MESSAGES]
  return (
    <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-r from-black via-neutral-900 to-black">
      <style>{`
        @keyframes chipo-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .chipo-marquee-track {
          display: inline-flex; white-space: nowrap; will-change: transform;
          animation: chipo-marquee 28s linear infinite;
        }
        .chipo-marquee-wrap:hover .chipo-marquee-track { animation-play-state: paused; }
      `}</style>
      <div className="chipo-marquee-wrap py-2">
        <div className="chipo-marquee-track">
          {items.map((m, i) => (
            <span key={i} className="flex items-center">
              <span className="px-4 text-[11px] font-medium uppercase tracking-[0.2em] text-gold-400/90 sm:text-xs">
                {m}
              </span>
              <span className="text-gold-500/50" aria-hidden>◆</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
