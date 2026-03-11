import { describe, it, expect, vi, beforeEach } from 'vitest'
import type Anthropic from '@anthropic-ai/sdk'
import { callClaudeWithContinuation } from '@/lib/inngest/functions'

// Mock config — must include all APP_CONFIG fields accessed at module level
vi.mock('@/lib/config', () => ({
  APP_CONFIG: {
    claude: {
      model: 'claude-sonnet-4-6',
      maxTokens: 32_000,
      pricing: {
        inputPerMillion: 3,
        outputPerMillion: 15,
      },
    },
    inngest: {
      retries: 3,
    },
  },
}))

// Mock parse-plan (stripEmojis passes through, parsePlanText returns sections)
vi.mock('@/lib/pdf/parse-plan', () => ({
  stripEmojis: (text: string) => text,
  parsePlanText: (text: string) => ({
    sections: text.includes('# ') ? [{ title: 'Section', content: 'content' }] : [],
  }),
}))

function createMockClient(responses: Array<{
  text: string
  stop_reason: string
  input_tokens?: number
  output_tokens?: number
}>) {
  let callIndex = 0
  return {
    messages: {
      create: vi.fn(async () => {
        const response = responses[callIndex++]
        return {
          content: [{ type: 'text', text: response.text }],
          stop_reason: response.stop_reason,
          usage: {
            input_tokens: response.input_tokens ?? 1000,
            output_tokens: response.output_tokens ?? 5000,
          },
        }
      }),
    },
  } as unknown as Pick<Anthropic, 'messages'> & { messages: { create: ReturnType<typeof vi.fn> } }
}

describe('callClaudeWithContinuation', () => {
  const prompt = 'Generate a meal plan'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return complete plan when response finishes normally', async () => {
    const client = createMockClient([
      { text: '# Nutritional Analysis\nFull plan content here.', stop_reason: 'end_turn' },
    ])

    const result = await callClaudeWithContinuation(client, prompt)

    expect(result.planText).toBe('# Nutritional Analysis\nFull plan content here.')
    expect(result.tokensUsed).toBe(6000)
    expect(client.messages.create).toHaveBeenCalledTimes(1)
  })

  it('should attempt continuation when response is truncated', async () => {
    const client = createMockClient([
      { text: '# Nutritional Analysis\nPartial content...', stop_reason: 'max_tokens', input_tokens: 1000, output_tokens: 8000 },
      { text: ' and here is the rest of the plan.', stop_reason: 'end_turn', input_tokens: 9000, output_tokens: 3000 },
    ])

    const result = await callClaudeWithContinuation(client, prompt)

    expect(result.planText).toBe('# Nutritional Analysis\nPartial content... and here is the rest of the plan.')
    expect(result.tokensUsed).toBe(21000) // 1000+8000 + 9000+3000
    expect(client.messages.create).toHaveBeenCalledTimes(2)
  })

  it('should pass original prompt and partial response in continuation call', async () => {
    const partialText = '# Nutritional Analysis\nPartial...'
    const client = createMockClient([
      { text: partialText, stop_reason: 'max_tokens' },
      { text: ' rest of plan.', stop_reason: 'end_turn' },
    ])

    await callClaudeWithContinuation(client, prompt)

    const continuationCall = (client.messages.create.mock.calls as any[][])[1][0]
    expect(continuationCall.messages).toEqual([
      { role: 'user', content: prompt },
      { role: 'assistant', content: partialText },
      { role: 'user', content: 'Your previous response was cut off. Please continue exactly where you left off — do not repeat any content.' },
    ])
  })

  it('should throw error when continuation is also truncated', async () => {
    const client = createMockClient([
      { text: '# Nutritional Analysis\nPartial...', stop_reason: 'max_tokens' },
      { text: 'still not done...', stop_reason: 'max_tokens' },
    ])

    await expect(callClaudeWithContinuation(client, prompt)).rejects.toThrow(
      'Response exceeded maximum length even after continuation'
    )
  })

  it('should throw error when plan has no parseable sections', async () => {
    const client = createMockClient([
      { text: 'Just some text without any headings at all.', stop_reason: 'end_turn' },
    ])

    await expect(callClaudeWithContinuation(client, prompt)).rejects.toThrow(
      'No sections found in generated plan'
    )
  })

  it('should not attempt continuation when truncated but text is empty', async () => {
    const client = createMockClient([
      { text: '', stop_reason: 'max_tokens' },
    ])

    // Empty text with no sections should throw the no-sections error, not attempt continuation
    await expect(callClaudeWithContinuation(client, prompt)).rejects.toThrow(
      'No sections found in generated plan'
    )
    expect(client.messages.create).toHaveBeenCalledTimes(1)
  })

  it('should calculate cost correctly across both calls', async () => {
    const client = createMockClient([
      { text: '# Plan\nPartial...', stop_reason: 'max_tokens', input_tokens: 2000, output_tokens: 10000 },
      { text: ' rest.', stop_reason: 'end_turn', input_tokens: 12000, output_tokens: 5000 },
    ])

    const result = await callClaudeWithContinuation(client, prompt)

    // Input: (2000 + 12000) / 1M * 3 = 0.042
    // Output: (10000 + 5000) / 1M * 15 = 0.225
    // Total: 0.267
    const expectedCost = (14000 / 1_000_000) * 3 + (15000 / 1_000_000) * 15
    expect(result.totalCost).toBeCloseTo(expectedCost)
    expect(result.tokensUsed).toBe(29000)
  })

  it('should use correct model and max_tokens from config', async () => {
    const client = createMockClient([
      { text: '# Plan\nContent here.', stop_reason: 'end_turn' },
    ])

    await callClaudeWithContinuation(client, prompt)

    expect(client.messages.create).toHaveBeenCalledWith({
      model: 'claude-sonnet-4-6',
      max_tokens: 32_000,
      messages: [{ role: 'user', content: prompt }],
    })
  })
})
