import { serve } from 'inngest/next'
import { inngest } from '@/lib/inngest/client'
import { generatePlan } from '@/lib/inngest/functions'

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generatePlan],
  signingKey: process.env.INNGEST_SIGNING_KEY,
})
