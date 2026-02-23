/**
 * Unit tests for client validation schemas
 */

import { describe, it, expect } from 'vitest'
import { createClientSchema, updateClientSchema } from '@/lib/validation'

describe('Client Validation Schemas', () => {
  describe('createClientSchema', () => {
    it('should validate correct client data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+44 7700 900000',
        age: 30,
        gender: 'M',
        height: 180,
        weight: 80,
        ideal_weight: 75,
        activity_level: 'moderately_active',
        goal: 'fat_loss',
        dietary_type: 'omnivore',
        allergies: 'Peanuts',
        dislikes: 'Mushrooms',
        preferences: 'Italian',
        budget: 70,
        cooking_skill: 'intermediate',
        prep_time: 30,
        meals_per_day: 3,
        plan_duration: 7,
        meal_prep_style: 'batch',
      }

      const result = createClientSchema.safeParse(validData)
      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.name).toBe('John Doe')
        expect(result.data.email).toBe('john@example.com')
        expect(result.data.age).toBe(30)
      }
    })

    it('should reject missing required fields', () => {
      const invalidData = {
        email: 'test@example.com',
        // Missing name, age, gender, etc.
      }

      const result = createClientSchema.safeParse(invalidData)
      expect(result.success).toBe(false)

      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0)
      }
    })

    it('should validate age constraints', () => {
      const tooYoung = {
        name: 'Young Person',
        age: 15, // Below minimum of 16
        gender: 'M',
        height: 170,
        weight: 65,
        ideal_weight: 63,
        activity_level: 'moderately_active',
        goal: 'fat_loss',
        dietary_type: 'omnivore',
        budget: 50,
        cooking_skill: 'beginner',
        prep_time: 20,
        meals_per_day: 3,
        plan_duration: 7,
        meal_prep_style: 'daily',
      }

      const result = createClientSchema.safeParse(tooYoung)
      expect(result.success).toBe(false)

      if (!result.success) {
        const ageError = result.error.errors.find((e) => e.path[0] === 'age')
        expect(ageError).toBeDefined()
        expect(ageError?.message).toContain('16')
      }
    })

    it('should validate email format', () => {
      const invalidEmail = {
        name: 'Test User',
        email: 'not-an-email',
        age: 25,
        gender: 'F',
        height: 165,
        weight: 60,
        ideal_weight: 58,
        activity_level: 'lightly_active',
        goal: 'fat_loss',
        dietary_type: 'vegan',
        budget: 50,
        cooking_skill: 'beginner',
        prep_time: 20,
        meals_per_day: 3,
        plan_duration: 7,
        meal_prep_style: 'daily',
      }

      const result = createClientSchema.safeParse(invalidEmail)
      expect(result.success).toBe(false)

      if (!result.success) {
        const emailError = result.error.errors.find((e) => e.path[0] === 'email')
        expect(emailError).toBeDefined()
        expect(emailError?.message).toContain('email')
      }
    })

    it('should allow empty email', () => {
      const noEmail = {
        name: 'Test User',
        email: '',
        age: 25,
        gender: 'F',
        height: 165,
        weight: 60,
        ideal_weight: 58,
        activity_level: 'lightly_active',
        goal: 'fat_loss',
        dietary_type: 'vegan',
        budget: 50,
        cooking_skill: 'beginner',
        prep_time: 20,
        meals_per_day: 3,
        plan_duration: 7,
        meal_prep_style: 'daily',
      }

      const result = createClientSchema.safeParse(noEmail)
      expect(result.success).toBe(true)
    })

    it('should sanitize text input', () => {
      const dataWithScripts = {
        name: 'John <script>alert("xss")</script> Doe',
        age: 30,
        gender: 'M',
        height: 180,
        weight: 80,
        ideal_weight: 75,
        activity_level: 'moderately_active',
        goal: 'fat_loss',
        dietary_type: 'omnivore',
        allergies: '<script>bad</script>Peanuts',
        dislikes: '',
        preferences: '',
        budget: 70,
        cooking_skill: 'intermediate',
        prep_time: 30,
        meals_per_day: 3,
        plan_duration: 7,
        meal_prep_style: 'batch',
      }

      const result = createClientSchema.safeParse(dataWithScripts)
      expect(result.success).toBe(true)

      if (result.success) {
        // Script tags should be stripped
        expect(result.data.name).not.toContain('<script>')
        expect(result.data.allergies).not.toContain('<script>')
      }
    })

    it('should validate weight constraints', () => {
      const tooLight = {
        name: 'Test',
        age: 25,
        gender: 'F',
        height: 165,
        weight: 35, // Below minimum of 40
        ideal_weight: 58,
        activity_level: 'lightly_active',
        goal: 'fat_loss',
        dietary_type: 'vegan',
        budget: 50,
        cooking_skill: 'beginner',
        prep_time: 20,
        meals_per_day: 3,
        plan_duration: 7,
        meal_prep_style: 'daily',
      }

      const result = createClientSchema.safeParse(tooLight)
      expect(result.success).toBe(false)
    })

    it('should validate budget constraints', () => {
      const lowBudget = {
        name: 'Test',
        age: 25,
        gender: 'F',
        height: 165,
        weight: 60,
        ideal_weight: 58,
        activity_level: 'lightly_active',
        goal: 'fat_loss',
        dietary_type: 'vegan',
        budget: 5, // Below minimum of 10
        cooking_skill: 'beginner',
        prep_time: 20,
        meals_per_day: 3,
        plan_duration: 7,
        meal_prep_style: 'daily',
      }

      const result = createClientSchema.safeParse(lowBudget)
      expect(result.success).toBe(false)
    })

    it('should validate enum fields', () => {
      const invalidGender = {
        name: 'Test',
        age: 25,
        gender: 'X', // Invalid gender
        height: 165,
        weight: 60,
        ideal_weight: 58,
        activity_level: 'moderately_active',
        goal: 'fat_loss',
        dietary_type: 'vegan',
        budget: 50,
        cooking_skill: 'beginner',
        prep_time: 20,
        meals_per_day: 3,
        plan_duration: 7,
        meal_prep_style: 'daily',
      }

      const result = createClientSchema.safeParse(invalidGender)
      expect(result.success).toBe(false)
    })
  })

  describe('updateClientSchema', () => {
    it('should allow partial updates', () => {
      const partialUpdate = {
        name: 'Updated Name',
        email: 'new@example.com',
      }

      const result = updateClientSchema.safeParse(partialUpdate)
      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.name).toBe('Updated Name')
        expect(result.data.email).toBe('new@example.com')
      }
    })

    it('should allow updating single field', () => {
      const singleFieldUpdate = {
        weight: 75,
      }

      const result = updateClientSchema.safeParse(singleFieldUpdate)
      expect(result.success).toBe(true)
    })

    it('should validate updated fields', () => {
      const invalidUpdate = {
        age: 10, // Too young
      }

      const result = updateClientSchema.safeParse(invalidUpdate)
      expect(result.success).toBe(false)
    })

    it('should allow empty updates', () => {
      const emptyUpdate = {}

      const result = updateClientSchema.safeParse(emptyUpdate)
      expect(result.success).toBe(true)
    })

    it('should sanitize updated text', () => {
      const updateWithScript = {
        name: 'New <script>alert("xss")</script> Name',
        allergies: 'Peanuts<script>bad</script>',
      }

      const result = updateClientSchema.safeParse(updateWithScript)
      expect(result.success).toBe(true)

      if (result.success) {
        expect(result.data.name).not.toContain('<script>')
        expect(result.data.allergies).not.toContain('<script>')
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle very long strings', () => {
      const longName = 'A'.repeat(200) // Exceeds max of 100

      const data = {
        name: longName,
        age: 25,
        gender: 'M',
        height: 180,
        weight: 80,
        ideal_weight: 75,
        activity_level: 'moderately_active',
        goal: 'fat_loss',
        dietary_type: 'omnivore',
        budget: 70,
        cooking_skill: 'intermediate',
        prep_time: 30,
        meals_per_day: 3,
        plan_duration: 7,
        meal_prep_style: 'batch',
      }

      const result = createClientSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should coerce numeric strings', () => {
      const stringNumbers = {
        name: 'Test',
        age: '30', // String that should be coerced
        gender: 'M',
        height: '180',
        weight: '80',
        ideal_weight: '75',
        activity_level: 'moderately_active',
        goal: 'fat_loss',
        dietary_type: 'omnivore',
        budget: '70',
        cooking_skill: 'intermediate',
        prep_time: '30',
        meals_per_day: '3',
        plan_duration: '7',
        meal_prep_style: 'batch',
      }

      const result = createClientSchema.safeParse(stringNumbers)
      expect(result.success).toBe(true)

      if (result.success) {
        expect(typeof result.data.age).toBe('number')
        expect(result.data.age).toBe(30)
      }
    })

    it('should handle whitespace in inputs', () => {
      const dataWithWhitespace = {
        name: '  John Doe  ',
        email: '  john@example.com  ',
        age: 30,
        gender: 'M',
        height: 180,
        weight: 80,
        ideal_weight: 75,
        activity_level: 'moderately_active',
        goal: 'fat_loss',
        dietary_type: 'omnivore',
        budget: 70,
        cooking_skill: 'intermediate',
        prep_time: 30,
        meals_per_day: 3,
        plan_duration: 7,
        meal_prep_style: 'batch',
      }

      const result = createClientSchema.safeParse(dataWithWhitespace)
      expect(result.success).toBe(true)

      if (result.success) {
        // Should be trimmed
        expect(result.data.name).toBe('John Doe')
        expect(result.data.email).toBe('john@example.com')
      }
    })
  })
})
