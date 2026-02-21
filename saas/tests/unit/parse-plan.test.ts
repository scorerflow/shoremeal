/**
 * PDF Parser Tests
 *
 * Tests the hybrid heading-based parser with various input formats:
 * - Current format (with PART prefixes)
 * - Clean format (suggested structure)
 * - Edge cases (extra headings, emojis, etc.)
 */

import { describe, it, expect } from 'vitest'
import { parsePlanText, stripEmojis } from '@/lib/pdf/parse-plan'

describe('parsePlanText - Hybrid Heading Parser', () => {
  describe('Current Format (with PART prefixes)', () => {
    it('should parse sections with PART N: prefix', () => {
      const markdown = `
# PART 1: NUTRITIONAL ANALYSIS

Your daily calorie target is 2,225 kcal.

# PART 2: YOUR 3-DAY MEAL PLAN

Day 1: Breakfast - Oats

# PART 3: RECIPES

## Oatmeal Recipe
Mix oats with milk.
`

      const result = parsePlanText(markdown)

      expect(result.sections).toHaveLength(3)
      expect(result.sections[0].title).toBe('PART 1 NUTRITIONAL ANALYSIS')
      expect(result.sections[1].title).toBe('PART 2 YOUR 3-DAY MEAL PLAN')
      expect(result.sections[2].title).toBe('PART 3 RECIPES')
    })
  })

  describe('Clean Format (suggested structure)', () => {
    it('should parse clean H1 headings without prefixes', () => {
      const markdown = `
# Nutritional Analysis

Your daily calorie target is 2,225 kcal.

# Meal Plan

Day 1: Breakfast - Oats

# Recipes

## Oatmeal Recipe
Mix oats with milk.
`

      const result = parsePlanText(markdown)

      expect(result.sections).toHaveLength(3)
      expect(result.sections[0].title).toBe('Nutritional Analysis')
      expect(result.sections[1].title).toBe('Meal Plan')
      expect(result.sections[2].title).toBe('Recipes')
    })
  })

  describe('Edge Cases', () => {
    it('should handle emojis in headings', () => {
      const markdown = `
# 🥗 Nutritional Analysis

Calories: 2000

# 🍽️ Meal Plan

Breakfast
`

      const result = parsePlanText(markdown)

      expect(result.sections).toHaveLength(2)
      expect(result.sections[0].title).toBe('Nutritional Analysis') // Emoji removed
      expect(result.sections[1].title).toBe('Meal Plan')
    })

    it('should handle trailing colons in headings', () => {
      const markdown = `
# Nutritional Analysis:

Content here

# Meal Plan :

More content
`

      const result = parsePlanText(markdown)

      expect(result.sections).toHaveLength(2)
      expect(result.sections[0].title).toBe('Nutritional Analysis') // Colon removed
      expect(result.sections[1].title).toBe('Meal Plan')
    })

    it('should ignore H2 and H3 headings for section boundaries', () => {
      const markdown = `
# Main Section

## Subsection
This is a subsection, not a new major section.

### Sub-subsection
This is even deeper.

# Another Main Section

Content
`

      const result = parsePlanText(markdown)

      // Only H1 headings create new sections
      expect(result.sections).toHaveLength(2)
      expect(result.sections[0].title).toBe('Main Section')
      expect(result.sections[1].title).toBe('Another Main Section')

      // Subsection content should be included in first section
      expect(result.sections[0].lines.join(' ')).toContain('Subsection')
    })

    it('should handle empty sections gracefully', () => {
      const markdown = `
# Section 1

Content here

# Section 2

# Section 3

More content
`

      const result = parsePlanText(markdown)

      // Section 2 has no content, should be excluded
      expect(result.sections).toHaveLength(2)
      expect(result.sections[0].title).toBe('Section 1')
      expect(result.sections[1].title).toBe('Section 3')
    })

    it('should return empty sections array if no H1 headings exist', () => {
      const markdown = `
This is just plain text with no headings.

## H2 Heading
Some content under H2.

### H3 Heading
More content.
`

      const result = parsePlanText(markdown)

      // No H1 headings = no sections
      // This triggers validation error in Inngest function
      expect(result.sections).toHaveLength(0)
      expect(result.raw).toBe(markdown)
    })

    it('should preserve raw markdown in result', () => {
      const markdown = `# Test\nContent`

      const result = parsePlanText(markdown)

      expect(result.raw).toBe(markdown)
    })
  })

  describe('Regression Tests (Current Plan Format)', () => {
    it('should work with actual plan format from database', () => {
      // This is the actual format Claude is currently generating
      const markdown = `
# 🥗 Your Personal Nutrition Plan

### Prepared exclusively for Kath | 28 years old | Fat Loss & Muscle Preservation

# PART 1: NUTRITIONAL ANALYSIS

## 📊 Your Calorie & Macro Targets

### Step-by-Step Calorie Calculation

**Basal Metabolic Rate (BMR)** — using the Mifflin-St Jeor equation for males:

# PART 2: YOUR 3-DAY MEAL PLAN

## DAY 1: Tuesday

### 🌅 Breakfast — Greek Yoghurt Power Bowl

# PART 3: RECIPES

## **Greek Yoghurt Power Bowl**

Ingredients...
`

      const result = parsePlanText(markdown)

      // Should find 4 H1 sections (including title)
      expect(result.sections.length).toBeGreaterThanOrEqual(3)

      // Section titles should be extracted correctly
      const titles = result.sections.map(s => s.title)
      expect(titles).toContain('PART 1 NUTRITIONAL ANALYSIS')
      expect(titles).toContain('PART 2 YOUR 3-DAY MEAL PLAN')
      expect(titles).toContain('PART 3 RECIPES')
    })
  })

  describe('stripEmojis', () => {
    it('should remove all emojis from text', () => {
      const text = '🥗 Nutritional Analysis 🍽️ Meal Plan'
      const result = stripEmojis(text)

      expect(result).toBe(' Nutritional Analysis  Meal Plan')
    })

    it('should remove emojis from multiline text', () => {
      const text = `# 🥗 Your Plan

## 📊 Calories

Your daily target is 2000 kcal.`

      const result = stripEmojis(text)

      expect(result).not.toContain('🥗')
      expect(result).not.toContain('📊')
      expect(result).toContain('Your Plan')
      expect(result).toContain('Calories')
    })

    it('should handle text with no emojis', () => {
      const text = 'Plain text with no emojis'
      const result = stripEmojis(text)

      expect(result).toBe(text)
    })

    it('should preserve all other characters', () => {
      const text = '🎯 Goal: Fat Loss (10% deficit) - £29/month'
      const result = stripEmojis(text)

      expect(result).toBe(' Goal: Fat Loss (10% deficit) - £29/month')
      expect(result).toContain('£')
      expect(result).toContain('%')
    })
  })
})
