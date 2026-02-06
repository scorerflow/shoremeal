import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, FileText, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import type { PlanStatus } from '@/types'

const DEV_MODE = process.env.DEV_MODE === 'true'

const STATUS_CONFIG: Record<PlanStatus, { icon: typeof Clock; label: string; colour: string; bg: string }> = {
  pending: { icon: Clock, label: 'Queued', colour: 'text-amber-600', bg: 'bg-amber-100' },
  generating: { icon: Loader2, label: 'Generating', colour: 'text-blue-600', bg: 'bg-blue-100' },
  completed: { icon: CheckCircle2, label: 'Completed', colour: 'text-green-600', bg: 'bg-green-100' },
  failed: { icon: XCircle, label: 'Failed', colour: 'text-red-600', bg: 'bg-red-100' },
}

interface PlanRow {
  id: string
  status: PlanStatus
  generation_cost: number
  tokens_used: number
  created_at: string
  updated_at: string
  clients: { name: string } | null
}

const MOCK_PLANS: PlanRow[] = [
  {
    id: '1',
    status: 'completed',
    generation_cost: 0.042,
    tokens_used: 11200,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    clients: { name: 'Sarah Mitchell' },
  },
  {
    id: '2',
    status: 'completed',
    generation_cost: 0.038,
    tokens_used: 10800,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    clients: { name: 'James Wilson' },
  },
  {
    id: '3',
    status: 'generating',
    generation_cost: 0,
    tokens_used: 0,
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    clients: { name: 'Emma Thompson' },
  },
]

export default async function PlansPage() {
  let plans: PlanRow[] = []

  if (DEV_MODE) {
    plans = MOCK_PLANS
  } else {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data } = await supabase
        .from('plans')
        .select('id, status, generation_cost, tokens_used, created_at, updated_at, clients(name)')
        .eq('trainer_id', user.id)
        .order('created_at', { ascending: false })

      plans = (data as unknown as PlanRow[]) || []
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Plans</h1>
          <p className="text-gray-600">{plans.length} nutrition plan{plans.length !== 1 ? 's' : ''} generated</p>
        </div>
        <Link href="/dashboard/clients/new" className="btn-primary flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          New Plan
        </Link>
      </div>

      {plans.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No plans yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first nutrition plan for a client.
          </p>
          <Link href="/dashboard/clients/new" className="btn-primary">
            Create First Plan
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => {
            const config = STATUS_CONFIG[plan.status] || STATUS_CONFIG.pending
            const StatusIcon = config.icon

            return (
              <Link
                key={plan.id}
                href={`/dashboard/plans/${plan.id}`}
                className="card block hover:border-primary-500 hover:shadow-md transition-all border border-transparent"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`p-2 rounded-lg ${config.bg}`}>
                      <StatusIcon className={`h-5 w-5 ${config.colour} ${plan.status === 'generating' ? 'animate-spin' : ''}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {plan.clients?.name || 'Unknown Client'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(plan.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    {plan.status === 'completed' && plan.tokens_used > 0 && (
                      <span className="text-sm text-gray-400 hidden sm:block">
                        {plan.tokens_used.toLocaleString()} tokens
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.colour}`}>
                      {config.label}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
