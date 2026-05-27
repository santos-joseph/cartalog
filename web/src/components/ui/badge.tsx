import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gray'

const variants: Record<BadgeVariant, string> = {
  default: 'bg-blue-100 text-blue-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  danger: 'bg-red-100 text-red-800',
  info: 'bg-purple-100 text-purple-800',
  gray: 'bg-gray-100 text-gray-800',
}

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function LeadStatusBadge({ status }: { status: { name: string } | null | string }) {
  const name = typeof status === 'string' ? status : status?.name ?? 'Sem status'
  return <Badge variant="gray">{name}</Badge>
}

export function VehicleStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    available: { label: 'Disponível', variant: 'success' },
    sold: { label: 'Vendido', variant: 'danger' },
    reserved: { label: 'Reservado', variant: 'warning' },
    inactive: { label: 'Inativo', variant: 'gray' },
  }
  const config = map[status.toLowerCase()] ?? { label: status, variant: 'gray' as BadgeVariant }
  return <Badge variant={config.variant}>{config.label}</Badge>
}
