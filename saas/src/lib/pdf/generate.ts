import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { registerFonts } from './fonts'
import { parsePlanText } from './parse-plan'
import { NutritionPlanDocument } from './components'
import type { BrandColours } from './styles'

interface GeneratePdfOptions {
  planText: string
  clientName: string
  trainerName: string
  businessName: string
  colours: BrandColours
  createdAt: string
}

export async function generatePlanPdf(options: GeneratePdfOptions): Promise<Buffer> {
  registerFonts()

  const plan = parsePlanText(options.planText)

  const doc = React.createElement(NutritionPlanDocument, {
    plan,
    clientName: options.clientName,
    trainerName: options.trainerName,
    businessName: options.businessName,
    colours: options.colours,
    createdAt: options.createdAt,
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(doc as any)
  return Buffer.from(buffer)
}
