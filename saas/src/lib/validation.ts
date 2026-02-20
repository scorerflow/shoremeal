import { z } from 'zod'

function sanitizeText(input: string): string {
  return input
    // Strip control characters (except newline, tab)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Strip script tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Strip HTML tags
    .replace(/<[^>]*>/g, '')
    // Strip template syntax ({{ }}, <% %>, ${ })
    .replace(/\{\{.*?\}\}/g, '')
    .replace(/<%.*?%>/g, '')
    .replace(/\$\{.*?\}/g, '')
    .trim()
}

const sanitizedString = z.string().transform(sanitizeText)

export const generatePlanSchema = z.object({
  clientId: z.string().uuid().optional(),
  name: sanitizedString.pipe(z.string().min(1, 'Client name is required').max(100)),
  age: z.coerce.number().int().min(16, 'Age must be at least 16').max(100, 'Age must be 100 or less'),
  gender: z.enum(['M', 'F'], { errorMap: () => ({ message: 'Gender must be M or F' }) }),
  height: z.coerce.number().min(140, 'Height must be at least 140cm').max(220, 'Height must be 220cm or less'),
  weight: z.coerce.number().min(40, 'Weight must be at least 40kg').max(200, 'Weight must be 200kg or less'),
  ideal_weight: z.coerce.number().min(40, 'Goal weight must be at least 40kg').max(200, 'Goal weight must be 200kg or less'),
  activity_level: z.enum(
    ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'],
    { errorMap: () => ({ message: 'Invalid activity level' }) }
  ),
  goal: z.enum(
    ['fat_loss', 'muscle_gain', 'maintenance', 'recomp'],
    { errorMap: () => ({ message: 'Invalid goal' }) }
  ),
  dietary_type: z.enum(
    ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo', 'gluten_free', 'dairy_free'],
    { errorMap: () => ({ message: 'Invalid dietary type' }) }
  ),
  allergies: sanitizedString.pipe(z.string().max(500)).default(''),
  dislikes: sanitizedString.pipe(z.string().max(500)).default(''),
  preferences: sanitizedString.pipe(z.string().max(500)).default(''),
  budget: z.coerce.number().int().min(10, 'Budget must be at least £10').max(1000, 'Budget must be £1000 or less'),
  cooking_skill: z.enum(
    ['beginner', 'intermediate', 'advanced'],
    { errorMap: () => ({ message: 'Invalid cooking skill level' }) }
  ),
  prep_time: z.coerce.number().int().min(10, 'Prep time must be at least 10 minutes').max(120, 'Prep time must be 120 minutes or less'),
  meals_per_day: z.coerce.number().int().min(2, 'Must be at least 2 meals').max(6, 'Must be 6 meals or less'),
  plan_duration: z.coerce.number().int().min(3, 'Plan must be at least 3 days').max(30, 'Plan must be 30 days or less'),
  meal_prep_style: z.enum(
    ['daily', 'batch', 'mixed'],
    { errorMap: () => ({ message: 'Invalid meal variety option' }) }
  ),
})

export type ValidatedPlanInput = z.infer<typeof generatePlanSchema>

export const checkoutSchema = z.object({
  tier: z.enum(['starter', 'pro', 'agency'], {
    errorMap: () => ({ message: 'Invalid subscription tier' }),
  }),
})

export type ValidatedCheckoutInput = z.infer<typeof checkoutSchema>
