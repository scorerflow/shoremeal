// ============================================================================
// Config Validation Helpers
// ============================================================================

function validateRequired(key: string, value: string | undefined): string {
  const trimmed = value?.trim()

  if (!trimmed) {
    throw new Error(`❌ Missing required environment variable: ${key}`)
  }

  if (trimmed !== value) {
    console.warn(`⚠️ Trimmed whitespace from ${key}`)
  }

  return trimmed
}

function validateUrl(key: string, value: string | undefined): string {
  const url = validateRequired(key, value)

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    throw new Error(`❌ Invalid URL in ${key}: must start with http:// or https://`)
  }

  return url
}

function validateStripePrice(key: string, value: string | undefined): string {
  const priceId = validateRequired(key, value)

  if (!priceId.startsWith('price_')) {
    throw new Error(
      `❌ Invalid Stripe Price ID in ${key}: "${priceId}"\n` +
      `   Expected format: price_xxxxx (not prod_xxxxx)\n` +
      `   Go to Stripe Dashboard → Products → Click on product → Copy the Price ID`
    )
  }

  return priceId
}

function validateOptional(value: string | undefined, defaultValue: string): string {
  return value?.trim() || defaultValue
}

// ============================================================================
// App Configuration (Validated)
// ============================================================================

export const APP_CONFIG = {
  // App URLs
  appUrl: validateUrl('NEXT_PUBLIC_APP_URL', process.env.NEXT_PUBLIC_APP_URL),

  // Stripe Configuration (server-side only, skip validation on client)
  stripe: (() => {
    const isServer = typeof window === 'undefined'
    const devMode = process.env.DEV_MODE === 'true'

    // On client-side, return dummy values (not used in browser)
    if (!isServer) {
      return {
        priceIds: {
          starter: 'price_client',
          pro: 'price_client',
          agency: 'price_client',
        },
      }
    }

    // On server-side, validate unless in DEV_MODE
    if (devMode) {
      return {
        priceIds: {
          starter: process.env.STRIPE_PRICE_STARTER || 'price_dev_starter',
          pro: process.env.STRIPE_PRICE_PRO || 'price_dev_pro',
          agency: process.env.STRIPE_PRICE_AGENCY || 'price_dev_agency',
        },
      }
    }

    // Production: validate all Stripe config
    return {
      priceIds: {
        starter: validateStripePrice('STRIPE_PRICE_STARTER', process.env.STRIPE_PRICE_STARTER),
        pro: validateStripePrice('STRIPE_PRICE_PRO', process.env.STRIPE_PRICE_PRO),
        agency: validateStripePrice('STRIPE_PRICE_AGENCY', process.env.STRIPE_PRICE_AGENCY),
      },
    }
  })(),

  // Claude AI Configuration
  claude: {
    model: validateOptional(process.env.CLAUDE_MODEL, 'claude-sonnet-4-6'),
    maxTokens: Number(process.env.CLAUDE_MAX_TOKENS) || 16_000,
    pricing: {
      inputPerMillion: Number(process.env.CLAUDE_INPUT_PRICE) || 3,
      outputPerMillion: Number(process.env.CLAUDE_OUTPUT_PRICE) || 15,
    },
  },

  // Rate Limits
  rateLimits: {
    generate: { maxRequests: 10, windowMs: 60_000 },
    auth: { maxRequests: 5, windowMs: 15 * 60_000 },
    billing: { maxRequests: 10, windowMs: 60_000 },
  },

  // Inngest
  inngest: {
    retries: 3,
  },

  // Defaults
  defaults: {
    branding: {
      primary: '#2C5F2D',
      secondary: '#4A7C4E',
      accent: '#FF8C00',
    },
  },

  // Polling
  polling: {
    intervalMs: 3_000,
    maxPolls: 100, // 5 minutes at 3s intervals
  },

  // Plan Timeout
  planTimeout: {
    staleMinutes: 10, // Plans stuck in 'generating' for more than 10 minutes are marked as failed
  },
} as const
