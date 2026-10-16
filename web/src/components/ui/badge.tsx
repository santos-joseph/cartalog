import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary',
        secondary: 'bg-secondary text-secondary-foreground',
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/15 text-warning-foreground',
        destructive: 'bg-destructive/10 text-destructive',
        outline: 'border border-border text-foreground',
        muted: 'bg-muted text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

function VehicleStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    available: { label: 'Disponível', variant: 'success' },
    sold: { label: 'Vendido', variant: 'destructive' },
    reserved: { label: 'Reservado', variant: 'warning' },
    inactive: { label: 'Inativo', variant: 'muted' },
  }
  const config = map[status.toLowerCase()] ?? { label: status, variant: 'muted' as const }
  return <Badge variant={config.variant}>{config.label}</Badge>
}

function LeadStatusBadge({ status }: { status: { name: string } | string | null }) {
  const name = typeof status === 'string' ? status : (status?.name ?? 'Sem status')
  return <Badge variant="muted">{name}</Badge>
}

export { Badge, badgeVariants, VehicleStatusBadge, LeadStatusBadge }
