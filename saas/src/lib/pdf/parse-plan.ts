import type {
  ParsedPlan,
  NutritionalAnalysis,
  MealPlanDay,
  Meal,
  Recipe,
  ShoppingCategory,
  ShoppingItem,
} from '@/types'

/** Collect all regex matches into an array (avoids downlevelIteration issue) */
function matchAll(text: string, pattern: RegExp): RegExpExecArray[] {
  const results: RegExpExecArray[] = []
  let m: RegExpExecArray | null
  // Ensure we use a fresh regex with global flag
  const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g')
  while ((m = re.exec(text)) !== null) {
    results.push(m)
  }
  return results
}

/**
 * Splits raw plan text on bold section headers like **NUTRITIONAL ANALYSIS**
 * Returns a map of header → content (trimmed)
 */
function splitSections(text: string): Map<string, string> {
  const sections = new Map<string, string>()
  const headerPattern = /\*\*([A-Z][A-Z0-9\s\-&/,]+)\*\*/g
  const matches = matchAll(text, headerPattern)

  for (let i = 0; i < matches.length; i++) {
    const key = matches[i][1].trim()
    const start = matches[i].index! + matches[i][0].length
    const end = i + 1 < matches.length ? matches[i + 1].index! : text.length
    sections.set(key, text.slice(start, end).trim())
  }

  return sections
}

function findSection(sections: Map<string, string>, ...keywords: string[]): string | undefined {
  const entries = Array.from(sections.entries())
  for (let i = 0; i < entries.length; i++) {
    const key = entries[i][0]
    const value = entries[i][1]
    const upper = key.toUpperCase()
    if (keywords.some(kw => upper.includes(kw))) {
      return value
    }
  }
  return undefined
}

function parseNutritionalAnalysis(text: string): NutritionalAnalysis | null {
  try {
    const extractMacro = (patterns: RegExp[]): string => {
      for (const pattern of patterns) {
        const match = text.match(pattern)
        if (match) return match[1].trim()
      }
      return ''
    }

    const calories = extractMacro([
      /(?:daily\s+)?calories?[:\s]*\*?\*?[\s]*([0-9,]+(?:\s*-\s*[0-9,]+)?\s*(?:kcal|calories)?)/i,
      /([0-9,]+(?:\s*-\s*[0-9,]+)?)\s*(?:kcal|calories)/i,
    ])

    const protein = extractMacro([
      /protein[:\s]*\*?\*?[\s]*([0-9]+(?:\s*-\s*[0-9]+)?g?\s*(?:\([^)]+\))?)/i,
    ])

    const carbs = extractMacro([
      /carb(?:ohydrate)?s?[:\s]*\*?\*?[\s]*([0-9]+(?:\s*-\s*[0-9]+)?g?\s*(?:\([^)]+\))?)/i,
    ])

    const fats = extractMacro([
      /fats?[:\s]*\*?\*?[\s]*([0-9]+(?:\s*-\s*[0-9]+)?g?\s*(?:\([^)]+\))?)/i,
    ])

    const paragraphs = text
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0)
      .filter(l => !/^[-•*]\s*(protein|carb|fat|calorie)/i.test(l))
      .filter(l => l.length > 40)

    return { calories, protein, carbs, fats, paragraphs }
  } catch {
    return null
  }
}

function parseMealPlan(text: string): MealPlanDay[] {
  const days: MealPlanDay[] = []
  try {
    const dayPattern = /\*?\*?DAY\s+(\d+)\*?\*?[:\s]*/gi
    const dayMatches = matchAll(text, dayPattern)

    for (let i = 0; i < dayMatches.length; i++) {
      const dayNum = dayMatches[i][1]
      const start = dayMatches[i].index! + dayMatches[i][0].length
      const end = i + 1 < dayMatches.length ? dayMatches[i + 1].index! : text.length
      const dayContent = text.slice(start, end).trim()

      const meals: Meal[] = []
      const mealPattern = /[-•*]*\s*\*?\*?(breakfast|lunch|dinner|snack(?:\s*\d)?|morning\s+snack|afternoon\s+snack|evening\s+snack|pre-workout|post-workout|supper)\*?\*?\s*[:–-]\s*/gi
      const mealMatches = matchAll(dayContent, mealPattern)

      for (let j = 0; j < mealMatches.length; j++) {
        const mealType = mealMatches[j][1].trim()
        const mStart = mealMatches[j].index! + mealMatches[j][0].length
        const mEnd = j + 1 < mealMatches.length ? mealMatches[j + 1].index! : dayContent.length
        const mealContent = dayContent.slice(mStart, mEnd).trim()

        const macroMatch = mealContent.match(/\(([^)]*(?:kcal|cal|calories|protein|carb|fat)[^)]*)\)/i)
        const macros = macroMatch ? macroMatch[1] : ''
        const description = mealContent
          .replace(/\([^)]*(?:kcal|cal|calories|protein|carb|fat)[^)]*\)/gi, '')
          .split('\n')[0]
          .trim()

        meals.push({
          type: mealType.charAt(0).toUpperCase() + mealType.slice(1).toLowerCase(),
          description,
          macros,
        })
      }

      days.push({
        dayLabel: `Day ${dayNum}`,
        meals: meals.length > 0 ? meals : [{ type: 'Meals', description: dayContent.split('\n')[0], macros: '' }],
      })
    }
  } catch {
    // Fallback handled by caller
  }
  return days
}

function parseRecipes(text: string): Recipe[] {
  const recipes: Recipe[] = []
  try {
    const recipePattern = /\*\*([^*]+)\*\*/g
    const matches = matchAll(text, recipePattern)

    const recipeHeaders = matches.filter(m => {
      const name = m[1].trim()
      return name.length > 3 &&
        name.length < 100 &&
        !/^(ingredients|instructions|method|steps|nutritional|nutrition|prep|cook)/i.test(name)
    })

    for (let i = 0; i < recipeHeaders.length; i++) {
      const name = recipeHeaders[i][1].trim()
      const start = recipeHeaders[i].index! + recipeHeaders[i][0].length
      const end = i + 1 < recipeHeaders.length ? recipeHeaders[i + 1].index! : text.length
      const content = text.slice(start, end).trim()

      const extract = (pattern: RegExp): string => {
        const m = content.match(pattern)
        return m ? m[1].trim() : ''
      }

      const prepTime = extract(/prep\s*(?:time)?[:\s]*([^\n]+)/i)
      const cookTime = extract(/cook\s*(?:time)?[:\s]*([^\n]+)/i)
      const calories = extract(/calories?[:\s]*([0-9,]+(?:\s*kcal)?)/i)
      const protein = extract(/protein[:\s]*([0-9]+g?)/i)
      const carbs = extract(/carb(?:ohydrate)?s?[:\s]*([0-9]+g?)/i)
      const fats = extract(/fats?[:\s]*([0-9]+g?)/i)

      const ingredients: string[] = []
      const ingredientsMatch = content.match(/(?:ingredients?)[:\s]*\n([\s\S]*?)(?=(?:\*\*)?(?:instructions?|method|steps|directions)[:\s]*)/i)
      if (ingredientsMatch) {
        const lines = ingredientsMatch[1].split('\n')
        for (const line of lines) {
          const cleaned = line.replace(/^[-•*\d.)\s]+/, '').trim()
          if (cleaned.length > 0) {
            ingredients.push(cleaned)
          }
        }
      }

      const instructions: string[] = []
      const instructionsMatch = content.match(/(?:instructions?|method|steps|directions)[:\s]*\n([\s\S]*?)(?=(?:\*\*)|$)/i)
      if (instructionsMatch) {
        const lines = instructionsMatch[1].split('\n')
        for (const line of lines) {
          const cleaned = line.replace(/^\s*\d+[.)]\s*/, '').replace(/^[-•*]\s*/, '').trim()
          if (cleaned.length > 0) {
            instructions.push(cleaned)
          }
        }
      }

      recipes.push({
        name,
        prepTime,
        cookTime,
        calories,
        protein,
        carbs,
        fats,
        ingredients,
        instructions,
      })
    }
  } catch {
    // Fallback handled by caller
  }
  return recipes
}

function parseShoppingList(text: string): ShoppingCategory[] {
  const categories: ShoppingCategory[] = []
  try {
    const catPattern = /\*?\*?([A-Za-z\s&/]+)\*?\*?\s*[:]\s*/g
    const matches = matchAll(text, catPattern)

    for (let i = 0; i < matches.length; i++) {
      const category = matches[i][1].trim()
      if (/^(estimated|total|money|budget|tip|note)/i.test(category)) continue

      const start = matches[i].index! + matches[i][0].length
      const end = i + 1 < matches.length ? matches[i + 1].index! : text.length
      const content = text.slice(start, end).trim()

      const items: ShoppingItem[] = []
      const lines = content.split('\n')
      for (const line of lines) {
        const cleaned = line.replace(/^[-•*]\s*/, '').trim()
        if (cleaned.length === 0) continue
        const qtyMatch = cleaned.match(/^(.+?)\s*[-–]\s*(.+)$/) ||
          cleaned.match(/^(.+?)\s*\((.+?)\)\s*$/)
        if (qtyMatch) {
          items.push({ name: qtyMatch[1].trim(), quantity: qtyMatch[2].trim() })
        } else {
          items.push({ name: cleaned, quantity: '' })
        }
      }

      if (items.length > 0) {
        categories.push({ category, items })
      }
    }
  } catch {
    // Fallback handled by caller
  }
  return categories
}

function parseParagraphs(text: string): string[] {
  if (!text) return []
  return text
    .split('\n')
    .map(l => l.replace(/^[-•*\d.)\s]+/, '').trim())
    .filter(l => l.length > 0)
}

export function parsePlanText(raw: string): ParsedPlan {
  const sections = splitSections(raw)

  const nutritionalText = findSection(sections, 'NUTRITIONAL', 'ANALYSIS')
  const mealPlanText = findSection(sections, 'MEAL PLAN', 'DAY MEAL')
  const recipesText = findSection(sections, 'RECIPE')
  const shoppingText = findSection(sections, 'SHOPPING')
  const mealPrepText = findSection(sections, 'MEAL PREP', 'PREP GUIDE')
  const tipsText = findSection(sections, 'ADDITIONAL', 'TIPS', 'ADVICE')

  return {
    nutritionalAnalysis: nutritionalText ? parseNutritionalAnalysis(nutritionalText) : null,
    mealPlan: mealPlanText ? parseMealPlan(mealPlanText) : [],
    recipes: recipesText ? parseRecipes(recipesText) : [],
    shoppingList: shoppingText ? parseShoppingList(shoppingText) : [],
    mealPrepGuide: mealPrepText ? parseParagraphs(mealPrepText) : [],
    additionalTips: tipsText ? parseParagraphs(tipsText) : [],
    raw,
  }
}
