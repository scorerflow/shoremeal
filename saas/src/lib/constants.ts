export interface SelectOption {
  value: string
  label: string
}

export const ACTIVITY_LEVELS: SelectOption[] = [
  { value: 'sedentary', label: 'Sedentary (little or no exercise)' },
  { value: 'lightly_active', label: 'Lightly active (1-3 days/week)' },
  { value: 'moderately_active', label: 'Moderately active (3-5 days/week)' },
  { value: 'very_active', label: 'Very active (6-7 days/week)' },
  { value: 'extremely_active', label: 'Extra active (physical job + exercise)' },
]

export const GOALS: SelectOption[] = [
  { value: 'fat_loss', label: 'Fat loss (maintain muscle)' },
  { value: 'maintenance', label: 'Weight maintenance' },
  { value: 'muscle_gain', label: 'Muscle gain / bulking' },
  { value: 'recomp', label: 'General health & wellness' },
]

export const DIET_TYPES: SelectOption[] = [
  { value: 'omnivore', label: 'Omnivore' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'pescatarian', label: 'Pescatarian' },
  { value: 'keto', label: 'Keto' },
  { value: 'paleo', label: 'Paleo' },
  { value: 'gluten_free', label: 'Gluten-free' },
  { value: 'dairy_free', label: 'Dairy-free' },
]

export const COOKING_SKILLS: SelectOption[] = [
  { value: 'beginner', label: 'Beginner (simple recipes)' },
  { value: 'intermediate', label: 'Intermediate (moderate complexity)' },
  { value: 'advanced', label: 'Advanced (any complexity)' },
]

export const MEAL_PREP_STYLES: SelectOption[] = [
  { value: 'daily', label: 'High variety (different meals daily)' },
  { value: 'batch', label: 'Moderate variety (batch cooking - meals repeat every 2-3 days)' },
  { value: 'mixed', label: 'Low variety (same meals all week)' },
]

export const PLAN_DURATIONS: SelectOption[] = [
  { value: '3', label: '3 days' },
  { value: '5', label: '5 days' },
  { value: '7', label: '7 days (1 week)' },
  { value: '14', label: '14 days (2 weeks)' },
]

export const MEALS_PER_DAY: SelectOption[] = [
  { value: '3', label: '3 meals' },
  { value: '4', label: '4 meals' },
  { value: '5', label: '5 meals' },
  { value: '6', label: '6 meals' },
]

// Lookup map for display labels (used by Inngest prompt builder)
// Built from the same source arrays to stay in sync
function buildLabelMap(options: SelectOption[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const opt of options) {
    map[opt.value] = opt.label
  }
  return map
}

export const DISPLAY_LABELS: Record<string, Record<string, string>> = {
  activity_level: buildLabelMap(ACTIVITY_LEVELS),
  goal: buildLabelMap(GOALS),
  dietary_type: buildLabelMap(DIET_TYPES),
  cooking_skill: buildLabelMap(COOKING_SKILLS),
  meal_prep_style: buildLabelMap(MEAL_PREP_STYLES),
}
