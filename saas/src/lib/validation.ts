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
  name: sanitizedString.pipe(z.string().min(1, 'Client name is required').max(100)),
  age: z.coerce.number().int().min(16, 'Age must be at least 16').max(100, 'Age must be 100 or less'),
  gender: z.enum(['M', 'F'], { errorMap: () => ({ message: 'Gender must be M or F' }) }),
  height: sanitizedString.pipe(z.string().min(1, 'Height is required').max(20)),
  weight: sanitizedString.pipe(z.string().min(1, 'Weight is required').max(20)),
  ideal_weight: sanitizedString.pipe(z.string().min(1, 'Ideal weight is required').max(20)),
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
  budget: sanitizedString.pipe(z.string().min(1, 'Budget is required').max(20)),
  cooking_skill: z.enum(
    ['beginner', 'intermediate', 'advanced'],
    { errorMap: () => ({ message: 'Invalid cooking skill level' }) }
  ),
  prep_time: sanitizedString.pipe(z.string().min(1, 'Prep time is required').max(10)),
  meals_per_day: sanitizedString.pipe(z.string().min(1, 'Meals per day is required').max(5)),
  plan_duration: sanitizedString.pipe(z.string().min(1, 'Plan duration is required').max(5)),
  meal_prep_style: z.enum(
    ['daily', 'batch', 'mixed'],
    { errorMap: () => ({ message: 'Invalid meal prep style' }) }
  ),
})

export type ValidatedPlanInput = z.infer<typeof generatePlanSchema>

export const checkoutSchema = z.object({
  tier: z.enum(['starter', 'pro', 'agency'], {
    errorMap: () => ({ message: 'Invalid subscription tier' }),
  }),
})

export type ValidatedCheckoutInput = z.infer<typeof checkoutSchema>
