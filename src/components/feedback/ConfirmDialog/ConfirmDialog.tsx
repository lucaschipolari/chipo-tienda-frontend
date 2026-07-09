import { AlertTriangle } from 'lucide-react'
import { Modal } from '@/components/ui/Modal/Modal'
import { Button } from '@/components/ui/Button/Button'

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  loading?: boolean
}

/**
 * ConfirmDialog — Modal de confirmación para acciones destructivas o irreversibles.
 *
 * @example
 * <ConfirmDialog
 *   isOpen={confirmOpen}
 *   onClose={() => setConfirmOpen(false)}
 *   onConfirm={handleDelete}
 *   title="¿Eliminar producto?"
 *   description="Esta acción no se puede deshacer."
 *   danger
 * />
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center gap-4">
        {/* Ícono */}
        <div
          className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
            danger ? 'bg-danger-500/15' : 'bg-gold-500/15'
          }`}
        >
          <AlertTriangle
            className={`h-6 w-6 ${danger ? 'text-danger-400' : 'text-gold-400'}`}
          />
        </div>

        {/* Texto */}
        <div>
          <h3 className="font-semibold text-white text-base mb-1">{title}</h3>
          {description && (
            <p className="text-sm text-neutral-400 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
    </Modal>
  )
}
