import { cn } from '@/utils/helpers/cn'

export function PageLoader({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        'min-h-[300px] gap-4',
        className,
      )}
      role="status"
      aria-label="Cargando página"
    >
      {/* Spinner dorado */}
      <div className="relative">
        <div className="h-10 w-10 rounded-full border-2 border-obsidian-700" />
        <div className="absolute inset-0 h-10 w-10 rounded-full border-2 border-t-gold-500 animate-spin-smooth" />
      </div>
      <p className="text-xs text-neutral-600 tracking-widest uppercase">
        Cargando
      </p>
    </div>
  )
}
