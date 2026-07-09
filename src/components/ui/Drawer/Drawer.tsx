import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/utils/helpers/cn'
import type { Side } from '@/types/common.types'

export interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  side?: Side
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
  footer?: React.ReactNode
  className?: string
}

const sizeClasses: Record<string, string> = {
  sm: 'w-72',
  md: 'w-80',
  lg: 'w-96',
  xl: 'w-[480px]',
}

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  side = 'right',
  size = 'md',
  showCloseButton = true,
  footer,
  className,
}: DrawerProps) {
  // Escape key
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // Bloquear scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-drawer flex">
      {/* Backdrop */}
      <div
        className="absolute inset-0 overlay-dark backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        className={cn(
          'relative flex flex-col h-full',
          'glass shadow-2xl',
          'max-w-full',
          sizeClasses[size],
          side === 'left' ? 'mr-auto animate-slide-in-left' : 'ml-auto animate-slide-in-right',
          className,
        )}
        role="dialog"
        aria-modal
        aria-labelledby={title ? 'drawer-title' : undefined}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 shrink-0">
            {title && (
              <h2
                id="drawer-title"
                className="font-semibold text-white text-base"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-neutral-500 hover:text-white hover:bg-obsidian-700 transition-colors ml-auto"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Body (scrollable) */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="shrink-0 border-t border-neutral-800 p-4 flex items-center gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
