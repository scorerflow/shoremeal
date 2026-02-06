import { Inngest } from 'inngest'

type Events = {
  'plan/generate.requested': {
    data: {
      planId: string
      clientId: string
      trainerId: string
      formData: Record<string, unknown>
      businessName?: string
    }
  }
}

export const inngest = new Inngest({ id: 'nutriplan-pro' })

export type { Events }
