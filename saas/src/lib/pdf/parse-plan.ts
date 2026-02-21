import type { ParsedPlan, PlanSection } from '@/types'

/**
 * Strip all emojis and variation selectors from text
 * Use this to clean plan_text before saving to database
 */
export function stripEmojis(text: string): string {
  return text.replace(/[\u{1F300}-\u{1F9FF}\u{FE00}-\u{FE0F}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
}

/**
 * HYBRID APPROACH: Parse by markdown heading structure
 *
 * Strategy:
 * 1. Find all H1 headings (# Title) → These become major sections
 * 2. Content between H1s becomes section content
 * 3. Works with ANY heading text (future-proof, language-agnostic)
 * 4. If Claude follows suggested structure → clean sections
 * 5. If Claude deviates → still works, just different section names
 *
 * Simpler than keyword matching, more flexible, future-proof.
 */
export function parsePlanText(raw: string): ParsedPlan {
  const allLines = raw.split('\n')
  const sections: PlanSection[] = []

  let currentSection: { title: string; startIndex: number } | null = null
  const sectionPositions: Array<{ title: string; startIndex: number; endIndex: number }> = []

  // Find all H1 headings and their positions
  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i].trim()

    // Check if this is an H1 heading (single #)
    const h1Match = line.match(/^#\s+(.+)$/)

    if (h1Match) {
      // If we were tracking a previous section, close it
      if (currentSection) {
        sectionPositions.push({
          ...currentSection,
          endIndex: i
        })
      }

      // Start tracking new section
      currentSection = {
        title: cleanTitle(h1Match[1]),
        startIndex: i + 1 // Content starts on next line
      }
    }
  }

  // Close the last section
  if (currentSection) {
    sectionPositions.push({
      ...currentSection,
      endIndex: allLines.length
    })
  }

  // Extract content for each section
  for (const { title, startIndex, endIndex } of sectionPositions) {
    const sectionText = allLines.slice(startIndex, endIndex).join('\n').trim()
    const lines = toLines(sectionText)

    if (lines.length > 0) {
      sections.push({ title, lines })
    }
  }

  return { sections, raw }
}

/** Clean up heading text (remove emojis, extra whitespace, trailing punctuation) */
function cleanTitle(title: string): string {
  return title
    .replace(/[\u{1F300}-\u{1F9FF}\u{FE00}-\u{FE0F}]/gu, '') // Remove emojis and variation selectors
    .replace(/^PART\s+(\d+)\s*:\s*/, 'PART $1 ') // Normalize "PART N: " to "PART N "
    .replace(/[:\s]+$/, '') // Remove trailing colons/whitespace
    .trim()
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
