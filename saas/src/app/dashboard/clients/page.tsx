import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Users, FileText, Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import type { PlanStatus } from '@/types'

const DEV_MODE = process.env.DEV_MODE === 'true'

const STATUS_ICON: Record<PlanStatus, { icon: typeof Clock; colour: string }> = {
  pending: { icon: Clock, colour: 'text-amber-500' },
  generating: { icon: Loader2, colour: 'text-blue-500' },
  completed: { icon: CheckCircle2, colour: 'text-green-500' },
  failed: { icon: XCircle, colour: 'text-red-500' },
}

interface ClientRow {
  id: string
  name: string
  email: string | null
  created_at: string
  plans: { id: string; status: PlanStatus; created_at: string }[]
}

const MOCK_CLIENTS: ClientRow[] = [
  {
    id: '1',
    name: 'Sarah Mitchell',
    email: 'sarah@example.com',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    plans: [
      { id: 'p1', status: 'completed', created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: '2',
    name: 'James Wilson',
    email: 'james@example.com',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    plans: [
      { id: 'p2', status: 'completed', created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
      { id: 'p3', status: 'completed', created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: '3',
    name: 'Emma Thompson',
    email: null,
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    plans: [
      { id: 'p4', status: 'generating', created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
    ],
  },
  {
    id: '4',
    name: 'Tom Bradley',
    email: 'tom.b@example.com',
    created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    plans: [],
  },
  {
    id: '5',
    name: 'Lucy Chen',
    email: 'lucy.chen@example.com',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    plans: [
      { id: 'p5', status: 'completed', created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
    ],
  },
]

export default async function ClientsPage() {
  let clients: ClientRow[] = []

  if (DEV_MODE) {
    clients = MOCK_CLIENTS
  } else {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data } = await supabase
        .from('clients')
        .select('id, name, email, created_at, plans(id, status, created_at)')
        .eq('trainer_id', user.id)
        .order('created_at', { ascending: false })

      clients = (data as unknown as ClientRow[]) || []
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/dashboard/clients/new" className="btn-primary flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          New Plan
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No clients yet</h3>
          <p className="text-gray-600 mb-6">
            Clients are created automatically when you generate a nutrition plan.
          </p>
          <Link href="/dashboard/clients/new" className="btn-primary">
            Create First Plan
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => {
            const latestPlan = client.plans
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
            const latestStatus = latestPlan?.status as PlanStatus | undefined
            const statusConfig = latestStatus ? STATUS_ICON[latestStatus] : null
            const LatestIcon = statusConfig?.icon

            return (
              <div
                key={client.id}
                className="card border border-transparent hover:border-primary-500 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{client.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {client.email && (
                        <p className="text-sm text-gray-500 truncate">{client.email}</p>
                      )}
                      <span className="text-sm text-gray-400">
                        Added {new Date(client.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Plan count + latest status */}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <FileText className="h-4 w-4" />
                      <span>{client.plans.length} plan{client.plans.length !== 1 ? 's' : ''}</span>
                      {LatestIcon && (
                        <LatestIcon className={`h-4 w-4 ${statusConfig!.colour} ${latestStatus === 'generating' ? 'animate-spin' : ''}`} />
                      )}
                    </div>

                    {/* Link to latest plan */}
                    {latestPlan ? (
                      <Link
                        href={`/dashboard/plans/${latestPlan.id}`}
                        className="text-sm text-primary-800 hover:underline whitespace-nowrap"
                      >
                        View plan
                      </Link>
                    ) : (
                      <Link
                        href="/dashboard/clients/new"
                        className="text-sm text-primary-800 hover:underline whitespace-nowrap"
                      >
                        Create plan
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
