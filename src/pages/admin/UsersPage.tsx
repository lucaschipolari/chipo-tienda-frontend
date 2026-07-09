import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Search, Shield, UserCheck, UserX, Ban, RefreshCw } from 'lucide-react'
import { DataTable } from '@/components/data-display/DataTable/DataTable'
import { Button } from '@/components/ui/Button/Button'
import { Badge } from '@/components/ui/Badge/Badge'
import { Modal } from '@/components/ui/Modal/Modal'
import { Input } from '@/components/ui/Input/Input'
import { Select } from '@/components/ui/Select/Select'
import { useDisclosure } from '@/hooks/useDisclosure'
import { useDebounce } from '@/hooks/useDebounce'
import { usePagination } from '@/hooks/usePagination'
import {
  useUsers,
  useCreateUser,
  useChangeUserStatus,
  useAssignRole,
} from '@/features/users/hooks/useUsers'
import { useRoles } from '@/features/roles/hooks/useRoles'
import type { UserListItem } from '@/features/users/usersService'
import type { ColumnDef, RowAction } from '@/types/common.types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  Active:    'Activo',
  Suspended: 'Suspendido',
  Blocked:   'Bloqueado',
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
  Active:    'success',
  Suspended: 'warning',
  Blocked:   'danger',
}

// ─── Schema del form ──────────────────────────────────────────────────────────

const createUserSchema = z.object({
  email:        z.string().min(1, 'Requerido').email('Email inválido'),
  password:     z.string().min(8, 'Mínimo 8 caracteres'),
  firstName:    z.string().min(1, 'Requerido').max(100),
  lastName:     z.string().min(1, 'Requerido').max(100),
  phoneNumber:  z.string().optional(),
})

type CreateUserValues = z.infer<typeof createUserSchema>

// ─── Modal: Crear usuario ─────────────────────────────────────────────────────

function CreateUserModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { mutate: createUser, isPending } = useCreateUser()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
  })

  const onSubmit = (values: CreateUserValues) => {
    createUser(values, {
      onSuccess: () => {
        reset()
        onClose()
      },
    })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo usuario"
      description="El usuario recibirá el rol Customer por defecto."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button
            form="create-user-form"
            type="submit"
            loading={isPending}
          >
            Crear usuario
          </Button>
        </>
      }
    >
      <form
        id="create-user-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nombre"
            required
            placeholder="Juan"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <Input
            label="Apellido"
            required
            placeholder="Pérez"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>
        <Input
          label="Correo electrónico"
          type="email"
          required
          placeholder="usuario@email.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Contraseña"
          type="password"
          required
          placeholder="Mínimo 8 caracteres"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Teléfono"
          type="tel"
          placeholder="+54 9 11 1234-5678"
          error={errors.phoneNumber?.message}
          {...register('phoneNumber')}
        />
      </form>
    </Modal>
  )
}

// ─── Modal: Asignar rol ───────────────────────────────────────────────────────

function AssignRoleModal({
  user,
  isOpen,
  onClose,
}: {
  user: UserListItem | null
  isOpen: boolean
  onClose: () => void
}) {
  const { data: roles = [] } = useRoles()
  const { mutate: assignRole, isPending } = useAssignRole()
  const [selectedRoleId, setSelectedRoleId] = useState('')

  if (!user) return null

  const availableRoles = roles.filter((r) => !user.roles.includes(r.name))

  const handleAssign = () => {
    if (!selectedRoleId) return
    assignRole(
      { userId: user.id, roleId: selectedRoleId },
      { onSuccess: () => { setSelectedRoleId(''); onClose() } },
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Asignar rol"
      description={`Agregar un rol a ${user.fullName}`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleAssign} loading={isPending} disabled={!selectedRoleId}>
            Asignar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Roles actuales */}
        <div>
          <p className="text-xs font-medium text-neutral-400 mb-2">Roles actuales</p>
          <div className="flex flex-wrap gap-1.5">
            {user.roles.length > 0
              ? user.roles.map((r) => (
                  <Badge key={r} variant="gold" size="sm">{r}</Badge>
                ))
              : <span className="text-xs text-neutral-600">Sin roles asignados</span>
            }
          </div>
        </div>

        <Select
          label="Nuevo rol"
          placeholder="Seleccioná un rol"
          value={selectedRoleId}
          onChange={(e) => setSelectedRoleId(e.target.value)}
          options={availableRoles.map((r) => ({ value: r.id, label: r.name }))}
        />
      </div>
    </Modal>
  )
}

// ─── Columnas de la tabla ─────────────────────────────────────────────────────

const columns: ColumnDef<UserListItem>[] = [
  {
    id: 'fullName',
    header: 'Usuario',
    cell: (row) => (
      <div>
        <p className="font-medium text-white">{row.fullName}</p>
        <p className="text-xs text-neutral-500">{row.email}</p>
      </div>
    ),
  },
  {
    id: 'roles',
    header: 'Roles',
    cell: (row) => (
      <div className="flex flex-wrap gap-1">
        {row.roles.length > 0
          ? row.roles.map((r) => (
              <Badge key={r} variant="gold" size="sm">{r}</Badge>
            ))
          : <span className="text-xs text-neutral-600">—</span>
        }
      </div>
    ),
  },
  {
    id: 'status',
    header: 'Estado',
    width: '120px',
    cell: (row) => (
      <Badge
        variant={STATUS_VARIANT[row.status] ?? 'default'}
        dot
        size="sm"
      >
        {STATUS_LABEL[row.status] ?? row.status}
      </Badge>
    ),
  },
  {
    id: 'createdAt',
    header: 'Registrado',
    width: '140px',
    accessor: (row) =>
      new Date(row.createdAt).toLocaleDateString('es-AR', {
        day: '2-digit', month: 'short', year: 'numeric',
      }),
  },
]

// ─── Página ───────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const createModal = useDisclosure()
  const assignRoleModal = useDisclosure()
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const { page, pageSize, setPage } = usePagination({ pageSize: 20 })

  const { data, isLoading, isFetching } = useUsers({
    page,
    pageSize,
    search: debouncedSearch || undefined,
  })

  const { mutate: changeStatus } = useChangeUserStatus()

  const rowActions: RowAction<UserListItem>[] = [
    {
      label: 'Asignar rol',
      icon: Shield,
      onClick: (row) => {
        setSelectedUser(row)
        assignRoleModal.open()
      },
    },
    {
      label: 'Activar',
      icon: UserCheck,
      hidden: (row) => row.status === 'Active',
      onClick: (row) => changeStatus({ id: row.id, action: 'activate' }),
    },
    {
      label: 'Suspender',
      icon: UserX,
      variant: 'danger',
      hidden: (row) => row.status !== 'Active',
      onClick: (row) => changeStatus({ id: row.id, action: 'suspend' }),
    },
    {
      label: 'Bloquear',
      icon: Ban,
      variant: 'danger',
      hidden: (row) => row.status === 'Blocked',
      onClick: (row) => changeStatus({ id: row.id, action: 'block' }),
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-white">Usuarios</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {data?.totalCount !== undefined
              ? `${data.totalCount} usuarios registrados`
              : 'Gestión de usuarios del sistema'}
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={createModal.open}
        >
          Nuevo usuario
        </Button>
      </div>

      {/* ── Tabla ── */}
      <DataTable
        columns={columns}
        data={data?.items ?? []}
        totalCount={data?.totalCount}
        rowKey="id"
        isLoading={isLoading}
        isFetching={isFetching}
        pagination={{ page, pageSize }}
        onPaginationChange={setPage}
        rowActions={rowActions}
        toolbar={
          <div className="flex items-center gap-3 flex-wrap">
            <Input
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              leftElement={<Search className="h-4 w-4" />}
              rightElement={
                search
                  ? <button onClick={() => setSearch('')} className="hover:text-white transition-colors">
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  : undefined
              }
              fullWidth={false}
              className="w-72"
            />
          </div>
        }
        emptyState={
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Shield className="h-10 w-10 text-neutral-700" />
            <p className="text-sm text-neutral-500">
              {search ? 'Sin resultados para tu búsqueda' : 'No hay usuarios registrados'}
            </p>
            {!search && (
              <Button size="sm" variant="secondary" onClick={createModal.open}>
                Crear primer usuario
              </Button>
            )}
          </div>
        }
      />

      {/* ── Modales ── */}
      <CreateUserModal isOpen={createModal.isOpen} onClose={createModal.close} />
      <AssignRoleModal
        user={selectedUser}
        isOpen={assignRoleModal.isOpen}
        onClose={assignRoleModal.close}
      />
    </div>
  )
}
