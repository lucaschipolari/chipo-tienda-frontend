import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Shield, Lock, ChevronDown, ChevronUp, Check } from 'lucide-react'
import { Card } from '@/components/ui/Card/Card'
import { Button } from '@/components/ui/Button/Button'
import { Badge } from '@/components/ui/Badge/Badge'
import { Modal } from '@/components/ui/Modal/Modal'
import { Input } from '@/components/ui/Input/Input'
import { Skeleton } from '@/components/ui/Skeleton/Skeleton'
import { useDisclosure } from '@/hooks/useDisclosure'
import { useRoles, usePermissions, useCreateRole, useUpdateRolePermissions } from '@/features/roles/hooks/useRoles'
import type { RoleListItem, PermissionDto } from '@/features/roles/rolesService'

// ─── Schema ───────────────────────────────────────────────────────────────────

const createRoleSchema = z.object({
  name:        z.string().min(2, 'Mínimo 2 caracteres').max(50),
  description: z.string().max(200).optional(),
})

type CreateRoleValues = z.infer<typeof createRoleSchema>

// ─── Modal: Crear rol ─────────────────────────────────────────────────────────

function CreateRoleModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { mutate: createRole, isPending } = useCreateRole()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateRoleValues>({
    resolver: zodResolver(createRoleSchema),
  })

  const onSubmit = (values: CreateRoleValues) => {
    createRole(values, {
      onSuccess: () => { reset(); onClose() },
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo rol"
      description="Los permisos se asignan desde la tarjeta del rol creado."
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button form="create-role-form" type="submit" loading={isPending}>Crear rol</Button>
        </>
      }
    >
      <form id="create-role-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Nombre del rol"
          required
          placeholder="ej: Vendedor"
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Descripción"
          placeholder="Descripción opcional"
          error={errors.description?.message}
          {...register('description')}
        />
      </form>
    </Modal>
  )
}

// ─── Modal: Editar permisos ───────────────────────────────────────────────────

function EditPermissionsModal({
  role,
  isOpen,
  onClose,
}: {
  role: RoleListItem | null
  isOpen: boolean
  onClose: () => void
}) {
  const { data: allPermissions = [] } = usePermissions()
  const { mutate: updatePermissions, isPending } = useUpdateRolePermissions()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // Agrupar permisos por recurso
  const grouped = allPermissions.reduce<Record<string, PermissionDto[]>>((acc, p) => {
    if (!acc[p.resource]) acc[p.resource] = []
    acc[p.resource].push(p)
    return acc
  }, {})

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleGroup = (perms: PermissionDto[]) => {
    const allSelected = perms.every((p) => selected.has(p.id))
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        perms.forEach((p) => next.delete(p.id))
      } else {
        perms.forEach((p) => next.add(p.id))
      }
      return next
    })
  }

  const handleSave = () => {
    if (!role) return
    updatePermissions(
      { roleId: role.id, permissionIds: Array.from(selected) },
      { onSuccess: onClose },
    )
  }

  if (!role) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Permisos: ${role.name}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>Cancelar</Button>
          <Button onClick={handleSave} loading={isPending}>
            Guardar permisos ({selected.size})
          </Button>
        </>
      }
    >
      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
        {Object.entries(grouped).map(([resource, perms]) => {
          const allSelected = perms.every((p) => selected.has(p.id))
          const someSelected = perms.some((p) => selected.has(p.id))

          return (
            <div key={resource} className="rounded-xl border border-neutral-800 overflow-hidden">
              {/* Grupo header */}
              <button
                type="button"
                onClick={() => toggleGroup(perms)}
                className="flex items-center justify-between w-full px-4 py-2.5 bg-obsidian-800/50 hover:bg-obsidian-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                    allSelected
                      ? 'bg-gold-500 border-gold-500'
                      : someSelected
                        ? 'bg-gold-500/30 border-gold-500/50'
                        : 'border-neutral-600'
                  }`}>
                    {(allSelected || someSelected) && <Check className="h-2.5 w-2.5 text-black" />}
                  </div>
                  <span className="text-sm font-medium text-white">{resource}</span>
                  <Badge size="sm">{perms.length}</Badge>
                </div>
              </button>

              {/* Permisos del grupo */}
              <div className="divide-y divide-neutral-800/60">
                {perms.map((perm) => (
                  <label
                    key={perm.id}
                    className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-obsidian-800/30 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(perm.id)}
                      onChange={() => toggle(perm.id)}
                      className="sr-only"
                    />
                    <div className={`h-4 w-4 shrink-0 rounded border flex items-center justify-center transition-colors ${
                      selected.has(perm.id)
                        ? 'bg-gold-500 border-gold-500'
                        : 'border-neutral-600'
                    }`}>
                      {selected.has(perm.id) && <Check className="h-2.5 w-2.5 text-black" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-neutral-300">{perm.action}</p>
                      {perm.description && (
                        <p className="text-xs text-neutral-600 truncate">{perm.description}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )
        })}

        {allPermissions.length === 0 && (
          <p className="text-sm text-neutral-500 text-center py-8">
            No hay permisos configurados en el sistema.
          </p>
        )}
      </div>
    </Modal>
  )
}

// ─── Tarjeta de rol ───────────────────────────────────────────────────────────

function RoleCard({
  role,
  onEditPermissions,
}: {
  role: RoleListItem
  onEditPermissions: (role: RoleListItem) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card>
      <Card.Body>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="mt-0.5 h-9 w-9 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0">
              <Shield className="h-4 w-4 text-gold-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-white">{role.name}</h3>
                {role.isSystem && (
                  <Badge variant="info" size="sm">
                    <Lock className="h-2.5 w-2.5" />
                    Sistema
                  </Badge>
                )}
              </div>
              {role.description && (
                <p className="text-sm text-neutral-500 mt-0.5">{role.description}</p>
              )}
              <p className="text-xs text-neutral-600 mt-1">
                {role.permissionCount} permiso{role.permissionCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!role.isSystem && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEditPermissions(role)}
              >
                Editar permisos
              </Button>
            )}
            <button
              onClick={() => setExpanded((p) => !p)}
              className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-400 hover:bg-obsidian-800 transition-colors"
              aria-label={expanded ? 'Contraer' : 'Expandir'}
            >
              {expanded
                ? <ChevronUp className="h-4 w-4" />
                : <ChevronDown className="h-4 w-4" />
              }
            </button>
          </div>
        </div>

        {/* Permisos expandidos */}
        {expanded && role.permissionCount === 0 && (
          <p className="mt-4 text-sm text-neutral-600 pl-12">Sin permisos asignados.</p>
        )}
      </Card.Body>
    </Card>
  )
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function RolesPage() {
  const createModal = useDisclosure()
  const permissionsModal = useDisclosure()
  const [selectedRole, setSelectedRole] = useState<RoleListItem | null>(null)

  const { data: roles = [], isLoading } = useRoles()

  const handleEditPermissions = (role: RoleListItem) => {
    setSelectedRole(role)
    permissionsModal.open()
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-white">Roles y Permisos</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {roles.length > 0
              ? `${roles.length} roles configurados`
              : 'Definí los roles y sus permisos en el sistema'}
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={createModal.open}
        >
          Nuevo rol
        </Button>
      </div>

      {/* ── Lista de roles ── */}
      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))
          : roles.length === 0
            ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl border border-dashed border-neutral-800">
                <Shield className="h-10 w-10 text-neutral-700" />
                <p className="text-sm text-neutral-500">No hay roles configurados</p>
                <Button size="sm" variant="secondary" onClick={createModal.open}>
                  Crear primer rol
                </Button>
              </div>
            )
            : roles.map((role) => (
              <RoleCard
                key={role.id}
                role={role}
                onEditPermissions={handleEditPermissions}
              />
            ))
        }
      </div>

      {/* ── Modales ── */}
      <CreateRoleModal isOpen={createModal.isOpen} onClose={createModal.close} />
      <EditPermissionsModal
        role={selectedRole}
        isOpen={permissionsModal.isOpen}
        onClose={permissionsModal.close}
      />
    </div>
  )
}
