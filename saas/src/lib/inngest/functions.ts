import { inngest } from './client'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { writeAuditLog } from '@/lib/audit'
import { updatePlanStatus } from '@/lib/repositories/plans'
import { incrementPlansUsed } from '@/lib/repositories/trainers'
import { APP_CONFIG } from '@/lib/config'
import { DISPLAY_LABELS } from '@/lib/constants'
import { stripEmojis, parsePlanText } from '@/lib/pdf/parse-plan'
import type { ClientFormData } from '@/types'

function getSupabase() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export const generatePlan = inngest.createFunction(
  {
    id: 'generate-nutrition-plan',
    retries: APP_CONFIG.inngest.retries,
    onFailure: async ({ event }) => {
      const { planId } = event.data.event.data as { planId: string }
      const supabase = getSupabase()

      await updatePlanStatus(supabase, planId, {
        status: 'failed',
        error_message: 'Plan generation failed after maximum retries',
      })

      await writeAuditLog({
        userId: (event.data.event.data as { trainerId: string }).trainerId,
        action: 'plan.generation_failed',
        resourceType: 'plan',
        resourceId: planId,
        metadata: { reason: 'max_retries_exhausted' },
      })
    },
  },
  { event: 'plan/generate.requested' },
  async ({ event, step }) => {
    const { planId, clientId, trainerId, formData, businessName } = event.data

    // Step 1: Mark plan as generating
    await step.run('mark-generating', async () => {
      const supabase = getSupabase()

      await updatePlanStatus(supabase, planId, { status: 'generating' })
      await supabase.rpc('increment_plan_attempts', { plan_uuid: planId })
    })

    // Step 2: Call Claude API (independently retryable)
    const result = await step.run('call-claude', async () => {
      const anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY!,
      })

      const typedFormData = formData as unknown as ClientFormData & { name: string }
      const prompt = buildNutritionPrompt(typedFormData, businessName)

      const message = await anthropic.messages.create({
        model: APP_CONFIG.claude.model,
        max_tokens: APP_CONFIG.claude.maxTokens,
        messages: [{ role: 'user', content: prompt }],
      })

      const rawPlanText = message.content[0].type === 'text'
        ? message.content[0].text
        : ''

      // Strip emojis from plan text before saving to database
      const planText = stripEmojis(rawPlanText)

      // Validate plan structure: ensure it has parseable sections
      // This prevents silent failures where PDF only shows cover page
      const parsed = parsePlanText(planText)
      if (parsed.sections.length === 0) {
        throw new Error(
          'Plan generation failed: No sections found in generated plan. ' +
          'Claude may not have used H1 headings for sections. ' +
          'This will trigger a retry with a fresh generation attempt.'
        )
      }

      const inputCost = (message.usage.input_tokens / 1_000_000) * APP_CONFIG.claude.pricing.inputPerMillion
      const outputCost = (message.usage.output_tokens / 1_000_000) * APP_CONFIG.claude.pricing.outputPerMillion
      const totalCost = inputCost + outputCost

      return {
        planText,
        totalCost,
        tokensUsed: message.usage.input_tokens + message.usage.output_tokens,
      }
    })

    // Step 3: Save result and update usage
    await step.run('save-result', async () => {
      const supabase = getSupabase()

      await updatePlanStatus(supabase, planId, {
        status: 'completed',
        plan_text: result.planText,
        generation_cost: result.totalCost,
        tokens_used: result.tokensUsed,
      })

      await incrementPlansUsed(supabase, trainerId)

      await writeAuditLog({
        userId: trainerId,
        action: 'plan.generation_completed',
        resourceType: 'plan',
        resourceId: planId,
        metadata: {
          clientId,
          tokensUsed: result.tokensUsed,
          cost: result.totalCost,
        },
      })
    })

    return { planId, status: 'completed' }
  }
)

function label(field: string, value: string): string {
  return DISPLAY_LABELS[field]?.[value] || value
}

function buildNutritionPrompt(data: ClientFormData & { name: string }, businessName?: string): string {
  return `You are an expert nutritionist and meal planning specialist. Create a comprehensive, personalised nutrition plan based on the following client information.

IMPORTANT: Use British English spelling throughout (optimise, colour, fibre, etc.) and UK currency (£).

CLIENT PROFILE:
- Name: ${data.name}
- Age: ${data.age}, Gender: ${data.gender}
- Height: ${data.height}
- Current Weight: ${data.weight}
- Ideal Weight: ${data.ideal_weight}
- Activity Level: ${label('activity_level', data.activity_level)}

GOALS:
- Primary Goal: ${label('goal', data.goal)}
- CRITICAL: Muscle preservation is paramount. Calculate protein targets to maintain lean muscle mass.
- Calculate optimal daily calories to reach their ideal weight healthily

DIETARY REQUIREMENTS:
- Diet Type: ${label('dietary_type', data.dietary_type)}
- Allergies: ${data.allergies || 'None'}
- Foods to Avoid: ${data.dislikes || 'None'}
- Cuisine Preferences: ${data.preferences || 'Varied'}

PRACTICAL CONSTRAINTS:
- Weekly Budget: £${data.budget}
- Cooking Skill: ${label('cooking_skill', data.cooking_skill)}
- Available Prep Time: ${data.prep_time} minutes per day
- Meals Per Day: ${data.meals_per_day}
- Plan Duration: ${data.plan_duration} days
- Meal Variety: ${label('meal_prep_style', data.meal_prep_style)}

Please create a comprehensive nutrition plan that includes:

IMPORTANT: Structure your response using clear markdown headings for each major section. Use single # for main sections (e.g., "# Nutritional Analysis"), ## for subsections, and ### for sub-subsections. This helps with PDF formatting.

1. **NUTRITIONAL ANALYSIS**
   - Calculate optimal daily calories based on their current weight, ideal weight, and activity level
   - Recommended macro split (protein/carbs/fats in grams and percentages)
   - Prioritise protein to preserve muscle mass (minimum 1.6-2.2g per kg of bodyweight)
   - Clear explanation of the nutritional strategy and why it works for their goals
   - Context about their journey and what to expect

2. **${data.plan_duration}-DAY MEAL PLAN**
   - Complete meal plan for ${data.plan_duration} days
   - Format each day clearly with "DAY 1:", "DAY 2:", etc. as headers
   - Each day should include all meals (breakfast, lunch, dinner, snacks as needed)
   - Include portion sizes and estimated calories/macros per meal
   - Keep recipes within their cooking skill level and time constraints
   - Consider budget constraints (weekly budget: £${data.budget})
   - Use British spelling and terminology
   - MEAL VARIETY STRATEGY: ${data.meal_prep_style === 'daily' ? 'Provide different meals each day to maximise variety and enjoyment.' : data.meal_prep_style === 'batch' ? 'Design meals that repeat every 2-3 days to enable batch cooking. For example, the same breakfast for Days 1-3, same lunch for Days 1-3, then new meals for Days 4-6. This minimises prep time while maintaining nutritional balance.' : 'Keep meals simple and repeat frequently throughout the week to minimise cooking time and decision fatigue.'}

3. **RECIPES**
   - Detailed recipes for each unique meal mentioned in the meal plan
   - Clearly label each recipe with its name as a header (use ** for bold)
   - Ingredients with quantities (use metric where possible)
   - Step-by-step cooking instructions
   - Prep time and cook time
   - Nutritional information (calories, protein, carbs, fats)
   - Use British spelling (e.g., courgette not zucchini, aubergine not eggplant)

4. **SHOPPING LIST**
   - Organised by category (produce, proteins, dairy, pantry, etc.)
   - Quantities needed for the full ${data.plan_duration}-day plan
   - Estimated cost breakdown to stay within £${data.budget} weekly budget
   - Money-saving tips for staying within budget
   - Use UK terminology and £ for prices

5. **MEAL PREP GUIDE**
   - Strategy tailored to ${label('meal_prep_style', data.meal_prep_style).toLowerCase()} preference
   - What to prep in advance to save time during the week
   - Storage instructions and how long meals keep
   - Reheating guidelines for best results
   - Time-saving tips for efficient meal preparation
   - ${data.meal_prep_style === 'batch' ? 'Batch cooking instructions: which meals to prepare together, optimal cooking order, and portion/storage guidance' : 'Practical tips for managing meal variety efficiently'}

6. **ADDITIONAL TIPS & ADVICE**
   - Hydration recommendations for optimal performance and recovery
   - Supplement suggestions if appropriate for their goals (be specific and explain why)
   - Tips for staying on track when eating out or socialising
   - How to adjust portions if feeling too hungry or too full
   - Signs of progress to look for beyond the scales
   - Encouragement and motivation for staying consistent
   - What to do if they have a "bad" day

Make this plan practical, achievable, and tailored specifically to ${data.name}'s needs. Use a warm, encouraging, and supportive tone throughout - this is a premium service and should feel personalised and caring. Write as if you're speaking directly to them, not about them. Use British English spelling throughout.`
}
