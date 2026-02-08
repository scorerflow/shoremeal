import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { withAuth } from '@/lib/auth'
import { handleRouteError } from '@/lib/errors'
import { generatePlanPdfForExport } from '@/lib/services/plans'

export const GET = withAuth(async (request: NextRequest, { user }, params) => {
  try {
    const planId = params?.id as string
    const supabase = await createServiceClient()

    const { pdfBuffer, clientName } = await generatePlanPdfForExport(supabase, planId, user.id)

    const safeName = clientName
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '_')
      .slice(0, 50)
    const filename = `Nutrition_Plan_${safeName}.pdf`

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-cache',
      },
    })
  } catch (error) {
    return handleRouteError(error, 'plans/pdf')
  }
})
