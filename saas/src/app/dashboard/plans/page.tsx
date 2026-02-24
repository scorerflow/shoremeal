import { requireAuth } from '@/lib/auth'
import { getPlansGroupedByClient } from '@/lib/data/plans-grouped'
import { getCachedTrainer } from '@/lib/data/cached'
import { getPlanCount } from '@/lib/repositories/plans'
import { PageHeader } from '@/components/PageHeader'
import Link from 'next/link'
import PlansPageClient from './PlansPageClient'

export default async function PlansPage() {
  const { user, supabase } = await requireAuth()

  // Fetch trainer to check subscription (cached — shared with layout)
  const trainer = await getCachedTrainer(user.id)
  const hasSubscription = trainer?.subscription_status === 'active'

  // Fetch plans grouped by client and total count in parallel
  const [{ groups, hasMore }, totalPlans] = await Promise.all([
    getPlansGroupedByClient(supabase, user.id),
    getPlanCount(supabase, user.id),
  ])

  return (
    <>
      <PageHeader
        title="Plans"
        subtitle={`${totalPlans} plan${totalPlans !== 1 ? 's' : ''} generated across ${groups.length} client${groups.length !== 1 ? 's' : ''}`}
        action={
          <Link href="/dashboard/clients/add" className="btn-primary">
            Add Client
          </Link>
        }
      />
      <PlansPageClient
        groupedClients={groups}
        hasSubscription={hasSubscription}
        totalPlans={totalPlans}
        hasMore={hasMore}
      />
    </>
  )
}
