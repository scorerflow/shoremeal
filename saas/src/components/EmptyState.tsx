import type { ReactNode } from 'react'
import Link from 'next/link'

export function EmptyState({
  icon,
  heading,
  description,
  actionLabel,
  actionHref,
}: {
  icon: ReactNode
  heading: string
  description: string
  actionLabel?: string
  actionHref?: string
}) {
  return (
    <div className="card text-center py-12">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{heading}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-primary">
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
