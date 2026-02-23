import Link from 'next/link'
import { Plus, Users, FileText, Mail, Phone, Calendar } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { StatusIcon } from '@/components/StatusBadge'
import { requireAuth } from '@/lib/auth'
import { getClientsList } from '@/lib/data/clients'

function formatLastPlanDate(dateString: string | null): string {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function ClientsPage() {
  const { user, supabase } = await requireAuth()
  const clients = await getClientsList(supabase, user.id)

  // Calculate stats
  const totalPlans = clients.reduce((sum, c) => sum + c.plans.length, 0)
  const activeThisMonth = clients.filter((c) => {
    if (!c.last_plan_date) return false
    const lastPlan = new Date(c.last_plan_date)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return lastPlan > thirtyDaysAgo
  }).length

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="Manage your client roster and their nutrition plans"
        action={
          <Link href="/dashboard/clients/add" className="btn-primary flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Add Client
          </Link>
        }
      />

      {/* Stats Cards */}
      {clients.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card">
            <p className="text-sm font-medium text-gray-600 mb-1">Total Clients</p>
            <p className="text-3xl font-bold text-gray-900">{clients.length}</p>
          </div>
          <div className="card">
            <p className="text-sm font-medium text-gray-600 mb-1">Active This Month</p>
            <p className="text-3xl font-bold text-green-600">{activeThisMonth}</p>
          </div>
          <div className="card">
            <p className="text-sm font-medium text-gray-600 mb-1">Total Plans Created</p>
            <p className="text-3xl font-bold text-blue-600">{totalPlans}</p>
          </div>
        </div>
      )}

      {clients.length === 0 ? (
        <EmptyState
          icon={<Users className="h-12 w-12 text-gray-300" />}
          heading="No clients yet"
          description="Add your first client to get started with generating nutrition plans."
          actionLabel="Add First Client"
          actionHref="/dashboard/clients/add"
        />
      ) : (
        <div className="space-y-3">
          {clients.map((client) => {
            const completedPlans = client.plans.filter((p) => p.status === 'completed').length
            const pendingPlans = client.plans.filter((p) => p.status === 'pending' || p.status === 'generating').length

            return (
              <div
                key={client.id}
                className="card border border-transparent hover:border-primary-500 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Client Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/dashboard/clients/${client.id}`}
                      className="font-semibold text-lg text-gray-900 hover:text-primary-800 truncate block mb-2"
                    >
                      {client.name}
                    </Link>

                    {/* Contact Info */}
                    <div className="flex flex-wrap gap-4 mb-3 text-sm text-gray-600">
                      {client.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          <span>{client.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-6 text-sm">
                      <div>
                        <span className="text-gray-500">Total Plans:</span>
                        <span className="ml-2 font-semibold text-gray-900">{client.plans.length}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Completed:</span>
                        <span className="ml-2 font-semibold text-green-600">{completedPlans}</span>
                      </div>
                      {pendingPlans > 0 && (
                        <div>
                          <span className="text-gray-500">Pending:</span>
                          <span className="ml-2 font-semibold text-orange-600">{pendingPlans}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-500">Last Plan:</span>
                        <span className="ml-2 font-semibold text-gray-900">{formatLastPlanDate(client.last_plan_date)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <Link
                      href={`/dashboard/clients/new?clientId=${client.id}`}
                      className="btn-primary text-sm whitespace-nowrap"
                    >
                      New Plan
                    </Link>
                    <Link
                      href={`/dashboard/clients/${client.id}`}
                      className="btn-secondary text-sm whitespace-nowrap"
                    >
                      View Details
                    </Link>
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
