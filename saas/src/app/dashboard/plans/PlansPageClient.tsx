'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FileText, ChevronDown, ChevronRight, Download, Calendar, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { ClientWithPlans } from '@/lib/data/plans-grouped'
import { StatusPill, getStatusConfig } from '@/components/StatusBadge'

interface PlansPageClientProps {
  groupedClients: ClientWithPlans[]
  hasSubscription: boolean
  totalPlans: number
}

function formatLastPlanDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function PlansPageClient({ groupedClients, hasSubscription, totalPlans }: PlansPageClientProps) {
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set())

  const toggleClient = (clientId: string) => {
    setExpandedClients((prev) => {
      const next = new Set(prev)
      if (next.has(clientId)) {
        next.delete(clientId)
      } else {
        next.add(clientId)
      }
      return next
    })
  }

  if (totalPlans === 0) {
    return (
      <div className="card">
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <FileText className="h-12 w-12 text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No plans yet</h2>
          <p className="text-gray-600 mb-6">
            {hasSubscription ? 'Create your first nutrition plan for a client.' : 'Subscribe to start generating nutrition plans.'}
          </p>
          <Link
            href={hasSubscription ? '/dashboard/clients/new' : '/pricing'}
            className="btn-primary"
          >
            {hasSubscription ? 'Create First Plan' : 'View Pricing'}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {groupedClients.map((client) => {
        const isExpanded = expandedClients.has(client.client_id)

        return (
          <div key={client.client_id} className="card border border-gray-200">
            {/* Client Header - Clickable */}
            <button
              onClick={() => toggleClient(client.client_id)}
              className="w-full text-left hover:bg-gray-50 transition-colors rounded-lg -m-6 p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {client.client_name}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>{client.plan_count} plan{client.plan_count !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>Last plan: {formatLastPlanDate(client.last_plan_date)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Pills */}
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  {client.stats.completed > 0 && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{client.stats.completed}</span>
                    </div>
                  )}
                  {client.stats.pending > 0 && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      <Clock className="h-4 w-4" />
                      <span>{client.stats.pending}</span>
                    </div>
                  )}
                  {client.stats.generating > 0 && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                      <Clock className="h-4 w-4 animate-spin" />
                      <span>{client.stats.generating}</span>
                    </div>
                  )}
                  {client.stats.failed > 0 && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                      <XCircle className="h-4 w-4" />
                      <span>{client.stats.failed}</span>
                    </div>
                  )}
                </div>
              </div>
            </button>

            {/* Expanded Plan List */}
            {isExpanded && (
              <div className="mt-6 pt-6 border-t border-gray-200 space-y-2">
                {client.plans.map((plan) => {
                  const config = getStatusConfig(plan.status)
                  const StatusIcon = config.icon

                  return (
                    <div
                      key={plan.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={`p-2 rounded-lg ${config.bg}`}>
                          <StatusIcon className={`h-4 w-4 ${config.colour} ${plan.status === 'generating' ? 'animate-spin' : ''}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(plan.created_at).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(plan.created_at).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {plan.tokens_used > 0 && (
                              <span className="ml-2">• {plan.tokens_used.toLocaleString()} tokens</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StatusPill status={plan.status} />
                        <Link
                          href={`/dashboard/plans/${plan.id}`}
                          className="btn-secondary text-sm py-2 px-3"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View
                        </Link>
                        {plan.status === 'completed' && (
                          <a
                            href={`/api/plans/${plan.id}/pdf`}
                            download
                            className="btn-secondary text-sm py-2 px-3 inline-flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
