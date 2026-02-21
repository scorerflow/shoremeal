import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { StatusPill, getStatusConfig } from '@/components/StatusBadge'
import { requireAuth } from '@/lib/auth'
import { getPlansList } from '@/lib/data/plans-list'
import { getTrainerById } from '@/lib/repositories/trainers'
import { SubscriptionTier } from '@/types'

export default async function PlansPage() {
  const { user, supabase } = await requireAuth()
  const [plans, trainer] = await Promise.all([
    getPlansList(supabase, user.id),
    getTrainerById(supabase, user.id),
  ])

  const DEV_MODE = process.env.DEV_MODE === 'true'
  const tier = trainer?.subscription_tier as SubscriptionTier | null
  const hasSubscription = DEV_MODE || (tier && trainer?.subscription_status === 'active')

  return (
    <div>
      <PageHeader
        title="Plans"
        subtitle={`${plans.length} nutrition plan${plans.length !== 1 ? 's' : ''} generated`}
        action={
          hasSubscription ? (
            <Link href="/dashboard/clients/new" className="btn-primary flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              New Plan
            </Link>
          ) : (
            <Link href="/pricing" className="btn-accent flex items-center">
              Upgrade to Create Plans
            </Link>
          )
        }
      />

      {plans.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-12 w-12 text-gray-300" />}
          heading="No plans yet"
          description={hasSubscription ? "Create your first nutrition plan for a client." : "Subscribe to start generating nutrition plans."}
          actionLabel={hasSubscription ? "Create First Plan" : "View Pricing"}
          actionHref={hasSubscription ? "/dashboard/clients/new" : "/pricing"}
        />
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => {
            const config = getStatusConfig(plan.status)
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
                    <StatusPill status={plan.status} />
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
