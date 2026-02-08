import Link from 'next/link'
import { Plus, Users, FileText } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { StatusIcon } from '@/components/StatusBadge'
import { requireAuth } from '@/lib/auth'
import { getClientsList } from '@/lib/data/clients'

export default async function ClientsPage() {
  const { user, supabase } = await requireAuth()
  const clients = await getClientsList(supabase, user.id)

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle={`${clients.length} client${clients.length !== 1 ? 's' : ''}`}
        action={
          <Link href="/dashboard/clients/new" className="btn-primary flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            New Plan
          </Link>
        }
      />

      {clients.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12 text-gray-300" />}
          heading="No clients yet"
          description="Clients are created automatically when you generate a nutrition plan."
          actionLabel="Create First Plan"
          actionHref="/dashboard/clients/new"
        />
      ) : (
        <div className="space-y-3">
          {clients.map((client) => {
            const latestPlan = client.plans
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

            return (
              <div
                key={client.id}
                className="card border border-transparent hover:border-primary-500 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/clients/${client.id}`}
                      className="font-medium text-gray-900 hover:text-primary-800 truncate block"
                    >
                      {client.name}
                    </Link>
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
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <FileText className="h-4 w-4" />
                      <span>{client.plans.length} plan{client.plans.length !== 1 ? 's' : ''}</span>
                      {latestPlan && <StatusIcon status={latestPlan.status} />}
                    </div>

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
