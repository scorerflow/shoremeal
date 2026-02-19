export const APP_CONFIG = {
  claude: {
    model: process.env.CLAUDE_MODEL || 'claude-sonnet-4-6',
    maxTokens: Number(process.env.CLAUDE_MAX_TOKENS) || 16_000,
    pricing: {
      inputPerMillion: Number(process.env.CLAUDE_INPUT_PRICE) || 3,
      outputPerMillion: Number(process.env.CLAUDE_OUTPUT_PRICE) || 15,
    },
  },
  rateLimits: {
    generate: { maxRequests: 10, windowMs: 60_000 },
    auth: { maxRequests: 5, windowMs: 15 * 60_000 },
    billing: { maxRequests: 10, windowMs: 60_000 },
  },
  inngest: {
    retries: 3,
  },
  defaults: {
    branding: {
      primary: '#2C5F2D',
      secondary: '#4A7C4E',
      accent: '#FF8C00',
    },
  },
  polling: {
    intervalMs: 3_000,
    maxPolls: 100, // 5 minutes at 3s intervals
  },
  planTimeout: {
    staleMinutes: 10, // Plans stuck in 'generating' for more than 10 minutes are marked as failed
  },
} as const
