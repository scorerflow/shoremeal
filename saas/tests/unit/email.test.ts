/**
 * Unit tests for email module (MOCKED - no real Resend calls)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { escapeHtml, buildPlanEmailHtml, sendPlanEmail } from '@/lib/email'

// Mock Resend SDK
const mockSend = vi.fn()
vi.mock('resend', () => {
  return {
    Resend: class MockResend {
      emails = { send: mockSend }
    },
  }
})

describe('escapeHtml', () => {
  it('should escape ampersands', () => {
    expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry')
  })

  it('should escape angle brackets', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    )
  })

  it('should escape quotes', () => {
    expect(escapeHtml('"hello" & \'world\'')).toBe('&quot;hello&quot; &amp; &#39;world&#39;')
  })

  it('should return empty string unchanged', () => {
    expect(escapeHtml('')).toBe('')
  })

  it('should handle strings with no special characters', () => {
    expect(escapeHtml('John Smith')).toBe('John Smith')
  })
})

describe('buildPlanEmailHtml', () => {
  it('should include escaped business name in header', () => {
    const html = buildPlanEmailHtml({
      clientName: 'Jane',
      trainerName: 'Mike',
      businessName: 'Mike\'s Fitness & Nutrition',
      primaryColour: '#2C5F2D',
    })

    expect(html).toContain('Mike&#39;s Fitness &amp; Nutrition')
    expect(html).not.toContain('Mike\'s Fitness & Nutrition')
  })

  it('should include client greeting', () => {
    const html = buildPlanEmailHtml({
      clientName: 'Jane Doe',
      trainerName: 'Mike',
      businessName: 'FitCo',
      primaryColour: '#2C5F2D',
    })

    expect(html).toContain('Hi Jane Doe,')
  })

  it('should include trainer name in signature', () => {
    const html = buildPlanEmailHtml({
      clientName: 'Jane',
      trainerName: 'Mike Johnson',
      businessName: 'FitCo',
      primaryColour: '#2C5F2D',
    })

    expect(html).toContain('<strong>Mike Johnson</strong>')
  })

  it('should use the primary colour in header', () => {
    const html = buildPlanEmailHtml({
      clientName: 'Jane',
      trainerName: 'Mike',
      businessName: 'FitCo',
      primaryColour: '#FF5500',
    })

    expect(html).toContain('background-color:#FF5500')
  })

  it('should include Forzafed footer', () => {
    const html = buildPlanEmailHtml({
      clientName: 'Jane',
      trainerName: 'Mike',
      businessName: 'FitCo',
      primaryColour: '#2C5F2D',
    })

    expect(html).toContain('Sent via Forzafed')
  })

  it('should escape client name with special characters', () => {
    const html = buildPlanEmailHtml({
      clientName: '<b>Hacker</b>',
      trainerName: 'Mike',
      businessName: 'FitCo',
      primaryColour: '#2C5F2D',
    })

    expect(html).toContain('Hi &lt;b&gt;Hacker&lt;/b&gt;,')
    expect(html).not.toContain('<b>Hacker</b>,')
  })
})

describe('sendPlanEmail', () => {
  const defaultParams = {
    to: 'client@example.com',
    clientName: 'Jane Doe',
    trainerName: 'Mike Johnson',
    businessName: 'FitCo',
    trainerEmail: 'mike@fitco.com',
    primaryColour: '#2C5F2D',
    pdfBuffer: Buffer.from('fake-pdf'),
    pdfFilename: 'Jane_Doe_Nutrition_Plan.pdf',
  }

  beforeEach(() => {
    mockSend.mockReset()
    process.env.RESEND_API_KEY = 'test-api-key'
  })

  afterEach(() => {
    delete process.env.RESEND_API_KEY
  })

  it('should send email and return ID on success', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email-123' }, error: null })

    const id = await sendPlanEmail(defaultParams)

    expect(id).toBe('email-123')
  })

  it('should pass correct parameters to Resend', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email-123' }, error: null })

    await sendPlanEmail(defaultParams)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'client@example.com',
        replyTo: 'mike@fitco.com',
        subject: 'Your Nutrition Plan from FitCo',
        attachments: [
          expect.objectContaining({
            filename: 'Jane_Doe_Nutrition_Plan.pdf',
          }),
        ],
      })
    )
  })

  it('should use from address with business name', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email-123' }, error: null })

    await sendPlanEmail(defaultParams)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'FitCo via Forzafed <plans@forzafed.com>',
      })
    )
  })

  it('should throw on Resend error', async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: 'Invalid recipient' } })

    await expect(sendPlanEmail(defaultParams)).rejects.toThrow('Failed to send email: Invalid recipient')
  })

  it('should include HTML body with escaped content', async () => {
    mockSend.mockResolvedValue({ data: { id: 'email-123' }, error: null })

    await sendPlanEmail(defaultParams)

    const call = mockSend.mock.calls[0][0]
    expect(call.html).toContain('Hi Jane Doe,')
    expect(call.html).toContain('<strong>Mike Johnson</strong>')
    expect(call.html).toContain('FitCo')
  })

  it('should use custom RESEND_FROM_EMAIL if set', async () => {
    process.env.RESEND_FROM_EMAIL = 'custom@forzafed.com'
    mockSend.mockResolvedValue({ data: { id: 'email-123' }, error: null })

    await sendPlanEmail(defaultParams)

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'FitCo via Forzafed <custom@forzafed.com>',
      })
    )

    delete process.env.RESEND_FROM_EMAIL
  })
})
