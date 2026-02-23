import { requireAuth } from '@/lib/auth'
import { getPlansGroupedByClient } from '@/lib/data/plans-grouped'
import { getTrainerById } from '@/lib/repositories/trainers'
import { PageHeader } from '@/components/PageHeader'
import Link from 'next/link'
import PlansPageClient from './PlansPageClient'

export default async function PlansPage() {
  const { user, supabase } = await requireAuth()

  // Fetch trainer to check subscription
  const trainer = await getTrainerById(supabase, user.id)
  const hasSubscription = trainer?.subscription_status === 'active'

  // Fetch plans grouped by client
  const groupedClients = await getPlansGroupedByClient(supabase, user.id)

  // Calculate total plans
  const totalPlans = groupedClients.reduce((sum, client) => sum + client.plan_count, 0)

  return (
    <>
      <PageHeader
        title="Plans"
        subtitle={`${totalPlans} plan${totalPlans !== 1 ? 's' : ''} generated across ${groupedClients.length} client${groupedClients.length !== 1 ? 's' : ''}`}
        action={
          <Link href="/dashboard/clients/add" className="btn-primary">
            Add Client
          </Link>
        }
      />
      <PlansPageClient
        groupedClients={groupedClients}
        hasSubscription={hasSubscription}
        totalPlans={totalPlans}
      />
    </>
  )
}
