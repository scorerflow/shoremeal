import { Resend } from 'resend'

let resendClient: Resend | null = null

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set')
    }
    resendClient = new Resend(apiKey)
  }
  return resendClient
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface SendPlanEmailParams {
  to: string
  clientName: string
  trainerName: string
  businessName: string
  trainerEmail: string
  primaryColour: string
  pdfBuffer: Buffer
  pdfFilename: string
}

export function buildPlanEmailHtml(params: {
  clientName: string
  trainerName: string
  businessName: string
  primaryColour: string
}): string {
  const clientName = escapeHtml(params.clientName)
  const trainerName = escapeHtml(params.trainerName)
  const businessName = escapeHtml(params.businessName)
  const primaryColour = escapeHtml(params.primaryColour)

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:${primaryColour};padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">${businessName}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.6;">
                Hi ${clientName},
              </p>
              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.6;">
                Your personalised nutrition plan is ready! Please find it attached as a PDF.
              </p>
              <p style="margin:0 0 24px;color:#374151;font-size:16px;line-height:1.6;">
                If you have any questions about your plan, just reply to this email and I'll be happy to help.
              </p>
              <p style="margin:0;color:#374151;font-size:16px;line-height:1.6;">
                Best regards,<br>
                <strong>${trainerName}</strong>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
                Sent via Forzafed
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendPlanEmail(params: SendPlanEmailParams): Promise<string> {
  const resend = getResendClient()

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'plans@forzafed.com'
  const from = `${params.businessName} via Forzafed <${fromEmail}>`

  const html = buildPlanEmailHtml({
    clientName: params.clientName,
    trainerName: params.trainerName,
    businessName: params.businessName,
    primaryColour: params.primaryColour,
  })

  const { data, error } = await resend.emails.send({
    from,
    to: params.to,
    replyTo: params.trainerEmail,
    subject: `Your Nutrition Plan from ${params.businessName}`,
    html,
    attachments: [
      {
        filename: params.pdfFilename,
        content: params.pdfBuffer,
      },
    ],
  })

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`)
  }

  return data!.id
}
