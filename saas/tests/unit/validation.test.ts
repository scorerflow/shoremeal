/**
 * Validation Schema Tests
 *
 * Tests all user input validation to prevent:
 * - Invalid data entering the system
 * - Injection attacks via form fields
 * - Out-of-range values causing errors
 * - Type coercion issues
 */

import { describe, it, expect } from 'vitest'
import { generatePlanSchema } from '@/lib/validation'

describe('Generate Plan Validation', () => {
  // Valid baseline data
  const validData = {
    name: 'Test Client',
    age: 30,
    gender: 'M' as const,
    height: 175,
    weight: 80,
    ideal_weight: 75,
    activity_level: 'moderately_active' as const,
    goal: 'fat_loss' as const,
    dietary_type: 'omnivore' as const,
    allergies: '',
    dislikes: '',
    preferences: '',
    budget: 70,
    cooking_skill: 'intermediate' as const,
    prep_time: 30,
    meals_per_day: 3,
    plan_duration: 7,
    meal_prep_style: 'batch' as const,
  }

  describe('Valid inputs', () => {
    it('should accept valid data', () => {
      const result = generatePlanSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should coerce string numbers to integers', () => {
      const result = generatePlanSchema.safeParse({
        ...validData,
        age: '28',
        height: '170',
        weight: '75',
        ideal_weight: '70',
        budget: '80',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.age).toBe(28)
        expect(result.data.height).toBe(170)
        expect(result.data.weight).toBe(75)
        expect(result.data.ideal_weight).toBe(70)
        expect(result.data.budget).toBe(80)
      }
    })

    it('should accept optional clientId as UUID', () => {
      const result = generatePlanSchema.safeParse({
        ...validData,
        clientId: '123e4567-e89b-12d3-a456-426614174000',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('Age validation', () => {
    it('should reject age below 16', () => {
      const result = generatePlanSchema.safeParse({ ...validData, age: 15 })
      expect(result.success).toBe(false)
    })

    it('should reject age above 100', () => {
      const result = generatePlanSchema.safeParse({ ...validData, age: 101 })
      expect(result.success).toBe(false)
    })

    it('should accept age at boundary (16)', () => {
      const result = generatePlanSchema.safeParse({ ...validData, age: 16 })
      expect(result.success).toBe(true)
    })

    it('should accept age at boundary (100)', () => {
      const result = generatePlanSchema.safeParse({ ...validData, age: 100 })
      expect(result.success).toBe(true)
    })

    it('should reject non-integer age', () => {
      const result = generatePlanSchema.safeParse({ ...validData, age: 25.5 })
      expect(result.success).toBe(false)
    })
  })

  describe('Height validation (cm)', () => {
    it('should reject height below 140cm', () => {
      const result = generatePlanSchema.safeParse({ ...validData, height: 139 })
      expect(result.success).toBe(false)
    })

    it('should reject height above 220cm', () => {
      const result = generatePlanSchema.safeParse({ ...validData, height: 221 })
      expect(result.success).toBe(false)
    })

    it('should accept height at boundary (140cm)', () => {
      const result = generatePlanSchema.safeParse({ ...validData, height: 140 })
      expect(result.success).toBe(true)
    })

    it('should accept height at boundary (220cm)', () => {
      const result = generatePlanSchema.safeParse({ ...validData, height: 220 })
      expect(result.success).toBe(true)
    })
  })

  describe('Weight validation (kg)', () => {
    it('should reject weight below 40kg', () => {
      const result = generatePlanSchema.safeParse({ ...validData, weight: 39 })
      expect(result.success).toBe(false)
    })

    it('should reject weight above 200kg', () => {
      const result = generatePlanSchema.safeParse({ ...validData, weight: 201 })
      expect(result.success).toBe(false)
    })

    it('should accept weight at boundaries', () => {
      expect(generatePlanSchema.safeParse({ ...validData, weight: 40 }).success).toBe(true)
      expect(generatePlanSchema.safeParse({ ...validData, weight: 200 }).success).toBe(true)
    })
  })

  describe('Goal weight validation (kg)', () => {
    it('should reject goal weight below 40kg', () => {
      const result = generatePlanSchema.safeParse({ ...validData, ideal_weight: 39 })
      expect(result.success).toBe(false)
    })

    it('should reject goal weight above 200kg', () => {
      const result = generatePlanSchema.safeParse({ ...validData, ideal_weight: 201 })
      expect(result.success).toBe(false)
    })

    it('should accept goal weight at boundaries', () => {
      expect(generatePlanSchema.safeParse({ ...validData, ideal_weight: 40 }).success).toBe(true)
      expect(generatePlanSchema.safeParse({ ...validData, ideal_weight: 200 }).success).toBe(true)
    })
  })

  describe('Budget validation (£)', () => {
    it('should reject budget below £10', () => {
      const result = generatePlanSchema.safeParse({ ...validData, budget: 9 })
      expect(result.success).toBe(false)
    })

    it('should reject budget above £1000', () => {
      const result = generatePlanSchema.safeParse({ ...validData, budget: 1001 })
      expect(result.success).toBe(false)
    })

    it('should accept budget at boundaries', () => {
      expect(generatePlanSchema.safeParse({ ...validData, budget: 10 }).success).toBe(true)
      expect(generatePlanSchema.safeParse({ ...validData, budget: 1000 }).success).toBe(true)
    })

    it('should reject non-integer budget', () => {
      const result = generatePlanSchema.safeParse({ ...validData, budget: 75.50 })
      expect(result.success).toBe(false)
    })
  })

  describe('Meals per day validation', () => {
    it('should reject less than 2 meals', () => {
      const result = generatePlanSchema.safeParse({ ...validData, meals_per_day: 1 })
      expect(result.success).toBe(false)
    })

    it('should reject more than 6 meals', () => {
      const result = generatePlanSchema.safeParse({ ...validData, meals_per_day: 7 })
      expect(result.success).toBe(false)
    })

    it('should accept meals at boundaries', () => {
      expect(generatePlanSchema.safeParse({ ...validData, meals_per_day: 2 }).success).toBe(true)
      expect(generatePlanSchema.safeParse({ ...validData, meals_per_day: 6 }).success).toBe(true)
    })
  })

  describe('Plan duration validation (days)', () => {
    it('should reject less than 3 days', () => {
      const result = generatePlanSchema.safeParse({ ...validData, plan_duration: 2 })
      expect(result.success).toBe(false)
    })

    it('should reject more than 30 days', () => {
      const result = generatePlanSchema.safeParse({ ...validData, plan_duration: 31 })
      expect(result.success).toBe(false)
    })

    it('should accept duration at boundaries', () => {
      expect(generatePlanSchema.safeParse({ ...validData, plan_duration: 3 }).success).toBe(true)
      expect(generatePlanSchema.safeParse({ ...validData, plan_duration: 30 }).success).toBe(true)
    })
  })

  describe('Prep time validation', () => {
    it('should reject less than 10 minutes', () => {
      const result = generatePlanSchema.safeParse({ ...validData, prep_time: 9 })
      expect(result.success).toBe(false)
    })

    it('should reject more than 120 minutes', () => {
      const result = generatePlanSchema.safeParse({ ...validData, prep_time: 121 })
      expect(result.success).toBe(false)
    })

    it('should accept prep time at boundaries', () => {
      expect(generatePlanSchema.safeParse({ ...validData, prep_time: 10 }).success).toBe(true)
      expect(generatePlanSchema.safeParse({ ...validData, prep_time: 120 }).success).toBe(true)
    })
  })

  describe('Enum validation', () => {
    it('should reject invalid gender', () => {
      const result = generatePlanSchema.safeParse({ ...validData, gender: 'X' })
      expect(result.success).toBe(false)
    })

    it('should reject invalid activity level', () => {
      const result = generatePlanSchema.safeParse({ ...validData, activity_level: 'super_active' })
      expect(result.success).toBe(false)
    })

    it('should reject invalid goal', () => {
      const result = generatePlanSchema.safeParse({ ...validData, goal: 'get_shredded' })
      expect(result.success).toBe(false)
    })

    it('should reject invalid dietary type', () => {
      const result = generatePlanSchema.safeParse({ ...validData, dietary_type: 'carnivore' })
      expect(result.success).toBe(false)
    })

    it('should reject invalid cooking skill', () => {
      const result = generatePlanSchema.safeParse({ ...validData, cooking_skill: 'expert' })
      expect(result.success).toBe(false)
    })

    it('should reject invalid meal variety', () => {
      const result = generatePlanSchema.safeParse({ ...validData, meal_prep_style: 'weekly' })
      expect(result.success).toBe(false)
    })

    it('should accept all valid meal variety options', () => {
      expect(generatePlanSchema.safeParse({ ...validData, meal_prep_style: 'daily' }).success).toBe(true)
      expect(generatePlanSchema.safeParse({ ...validData, meal_prep_style: 'batch' }).success).toBe(true)
      expect(generatePlanSchema.safeParse({ ...validData, meal_prep_style: 'mixed' }).success).toBe(true)
    })
  })

  describe('Text field sanitization', () => {
    it('should strip HTML from name', () => {
      const result = generatePlanSchema.safeParse({
        ...validData,
        name: '<script>alert("xss")</script>John Doe',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('John Doe')
        expect(result.data.name).not.toContain('<script>')
      }
    })

    it('should strip script tags from allergies', () => {
      const result = generatePlanSchema.safeParse({
        ...validData,
        allergies: 'Nuts <script>malicious()</script>',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.allergies).not.toContain('<script>')
      }
    })

    it('should limit text field length', () => {
      const longText = 'a'.repeat(600)
      const result = generatePlanSchema.safeParse({
        ...validData,
        allergies: longText,
      })
      expect(result.success).toBe(false) // Max 500 chars
    })
  })

  describe('Required fields', () => {
    it('should reject missing name', () => {
      const { name, ...dataWithoutName } = validData
      const result = generatePlanSchema.safeParse(dataWithoutName)
      expect(result.success).toBe(false)
    })

    it('should allow empty optional fields', () => {
      const result = generatePlanSchema.safeParse({
        ...validData,
        allergies: '',
        dislikes: '',
        preferences: '',
      })
      expect(result.success).toBe(true)
    })
  })
})
