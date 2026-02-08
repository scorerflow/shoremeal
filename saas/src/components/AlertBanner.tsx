import type { ReactNode } from 'react'

type Variant = 'error' | 'warning' | 'success' | 'info'

const VARIANT_STYLES: Record<Variant, string> = {
  error: 'bg-red-50 border-red-200 text-red-700',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  success: 'bg-green-50 border-green-200 text-green-700',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
}

export function AlertBanner({
  variant,
  children,
  className = '',
}: {
  variant: Variant
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`border rounded-lg px-4 py-3 ${VARIANT_STYLES[variant]} ${className}`}>
      {children}
    </div>
  )
}
