// Subscription tiers
export type SubscriptionTier = 'starter' | 'pro' | 'agency'

export interface TierConfig {
  name: string
  price: number
  plansPerMonth: number
  features: string[]
  stripePriceId: string
}

export const TIERS: Record<SubscriptionTier, TierConfig> = {
  starter: {
    name: 'Starter',
    price: 29,
    plansPerMonth: 10,
    features: [
      '10 nutrition plans per month',
      'PDF export',
      'Email support',
      'Basic branding (logo)',
    ],
    stripePriceId: process.env.STRIPE_PRICE_STARTER || '',
  },
  pro: {
    name: 'Pro',
    price: 49,
    plansPerMonth: 30,
    features: [
      '30 nutrition plans per month',
      'PDF export',
      'Priority support',
      'Full branding (logo + colours)',
      'Client history',
    ],
    stripePriceId: process.env.STRIPE_PRICE_PRO || '',
  },
  agency: {
    name: 'Agency',
    price: 99,
    plansPerMonth: 100,
    features: [
      '100 nutrition plans per month',
      'PDF export',
      'Dedicated support',
      'Full white-label branding',
      'Client history',
      'API access',
    ],
    stripePriceId: process.env.STRIPE_PRICE_AGENCY || '',
  },
}

// Plan status
export type PlanStatus = 'pending' | 'generating' | 'completed' | 'failed'

// Database types
export interface Trainer {
  id: string
  email: string
  full_name: string | null
  business_name: string | null
  stripe_customer_id: string | null
  subscription_tier: SubscriptionTier | null
  subscription_status: 'active' | 'cancelled' | 'past_due' | null
  plans_used_this_month: number
  billing_cycle_start: string | null
  created_at: string
  updated_at: string
}

export interface Branding {
  id: string
  trainer_id: string
  logo_url: string | null
  primary_colour: string
  secondary_colour: string
  accent_colour: string
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  trainer_id: string
  name: string
  email: string | null
  form_data: ClientFormData
  created_at: string
  updated_at: string
}

export interface ClientFormData {
  age: string
  gender: 'M' | 'F'
  height: string
  weight: string
  ideal_weight: string
  activity_level: string
  goal: string
  dietary_type: string
  allergies: string
  dislikes: string
  preferences: string
  budget: string
  cooking_skill: string
  prep_time: string
  meals_per_day: string
  plan_duration: string
  meal_prep_style: string
}

export interface Plan {
  id: string
  client_id: string
  trainer_id: string
  pdf_url: string | null
  plan_text: string | null
  generation_cost: number
  tokens_used: number
  status: PlanStatus
  error_message: string | null
  attempts: number
  created_at: string
  updated_at: string
}

export interface WebhookEvent {
  id: string
  event_type: string
  payload: Record<string, unknown>
  status: 'processing' | 'processed' | 'failed'
  error_message: string | null
  created_at: string
}

export interface AuditLogEntry {
  id: string
  user_id: string | null
  action: string
  resource_type: string | null
  resource_id: string | null
  metadata: Record<string, unknown>
  ip_address: string | null
  created_at: string
}

// API response types
export interface GeneratePlanResponse {
  success: boolean
  plan_id?: string
  client_id?: string
  status?: PlanStatus
  error?: string
  code?: string
  details?: Record<string, string>
}

// Parsed plan types (for PDF generation)
export interface NutritionalAnalysis {
  calories: string
  protein: string
  carbs: string
  fats: string
  paragraphs: string[]
}

export interface Meal {
  type: string
  description: string
  macros: string
}

export interface MealPlanDay {
  dayLabel: string
  meals: Meal[]
}

export interface Recipe {
  name: string
  prepTime: string
  cookTime: string
  calories: string
  protein: string
  carbs: string
  fats: string
  ingredients: string[]
  instructions: string[]
}

export interface ShoppingItem {
  name: string
  quantity: string
}

export interface ShoppingCategory {
  category: string
  items: ShoppingItem[]
}

export interface ParsedPlan {
  nutritionalAnalysis: NutritionalAnalysis | null
  mealPlan: MealPlanDay[]
  recipes: Recipe[]
  shoppingList: ShoppingCategory[]
  mealPrepGuide: string[]
  additionalTips: string[]
  raw: string
}
