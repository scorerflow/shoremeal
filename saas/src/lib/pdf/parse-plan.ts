import type { ParsedPlan, PlanSection } from '@/types'

// Patterns anchored to match the FULL cleaned title, not substrings within content.
const SECTION_TITLES: { key: RegExp; title: string }[] = [
  { key: /^NUTRITIONAL\s+ANALYSIS$/i, title: 'Nutritional Analysis' },
  { key: /^(?:\d+-DAY\s+)?MEAL\s+PLAN$/i, title: 'Meal Plan' },
  { key: /^(?:DETAILED\s+)?RECIPES?$/i, title: 'Recipes' },
  { key: /^SHOPPING\s+LIST$/i, title: 'Shopping List' },
  { key: /^MEAL\s+PREP(?:\s+GUIDE)?$/i, title: 'Meal Prep Guide' },
  { key: /^ADDITIONAL\s+TIPS(?:\s+(?:&|AND)\s+ADVICE)?$/i, title: 'Additional Tips & Advice' },
]

/**
 * Find the main section boundaries in the raw plan text.
 * Returns an ordered list of sections, each with a title and raw markdown lines.
 */
export function parsePlanText(raw: string): ParsedPlan {
  const allLines = raw.split('\n')

  // Find where each section starts
  const positions: { title: string; lineIndex: number }[] = []

  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i].trim()
    // Must look like a header line (markdown heading or bold text)
    if (!/^#{1,3}\s+/.test(line) && !/^(?:\d+[.)]\s*)?\*\*/.test(line)) continue

    // Strip markdown to get clean title text for anchored matching
    const clean = line
      .replace(/^#{1,3}\s+/, '')
      .replace(/^\d+[.)]\s*/, '')
      .replace(/\*\*/g, '')
      .replace(/[:\s]+$/, '')
      .trim()

    for (const { key, title } of SECTION_TITLES) {
      if (key.test(clean) && !positions.some((p) => p.title === title)) {
        positions.push({ title, lineIndex: i })
        break
      }
    }
  }

  // Extract content between section headers
  const sections: PlanSection[] = []
  for (let i = 0; i < positions.length; i++) {
    const startLine = positions[i].lineIndex + 1
    const endLine = i + 1 < positions.length ? positions[i + 1].lineIndex : allLines.length
    const sectionText = allLines.slice(startLine, endLine).join('\n').trim()

    const lines = toLines(sectionText)
    if (lines.length > 0) {
      sections.push({ title: positions[i].title, lines })
    }
  }

  return { sections, raw }
}

/** Split text into lines, merging orphan numbers with the next line */
function toLines(text: string): string[] {
  if (!text) return []
  const rawLines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0)

  const merged: string[] = []
  for (let i = 0; i < rawLines.length; i++) {
    if (/^\d+[.)]\s*$/.test(rawLines[i]) && i + 1 < rawLines.length) {
      merged.push(rawLines[i] + ' ' + rawLines[i + 1])
      i++
    } else {
      merged.push(rawLines[i])
    }
  }

  return merged
}
