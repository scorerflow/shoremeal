import { describe, it, expect } from 'vitest'
import { generatePlanSchema, checkoutSchema } from '../validation'

describe('generatePlanSchema', () => {
  const validInput = {
    name: 'John Doe',
    age: 25,
    gender: 'M' as const,
    height: '180cm',
    weight: '75kg',
    ideal_weight: '70kg',
    activity_level: 'moderately_active' as const,
    goal: 'fat_loss' as const,
    dietary_type: 'omnivore' as const,
    allergies: 'None',
    dislikes: 'Mushrooms',
    preferences: 'Likes spicy food',
    budget: '$50/week',
    cooking_skill: 'intermediate' as const,
    prep_time: '30min',
    meals_per_day: '3',
    plan_duration: '7',
    meal_prep_style: 'mixed' as const,
  }

  describe('XSS sanitization', () => {
    it('should strip script tags from name', () => {
      const input = {
        ...validInput,
        name: '<script>alert("xss")</script>John Doe',
      }
      const result = generatePlanSchema.parse(input)
      expect(result.name).toBe('John Doe')
      expect(result.name).not.toContain('<script>')
    })

    it('should strip HTML tags from text fields', () => {
      const input = {
        ...validInput,
        allergies: '<b>Peanuts</b> and <i>shellfish</i>',
      }
      const result = generatePlanSchema.parse(input)
      expect(result.allergies).toBe('Peanuts and shellfish')
      expect(result.allergies).not.toContain('<b>')
    })

    it('should strip template syntax from preferences', () => {
      const input = {
        ...validInput,
        preferences: 'I like {{ malicious }} food',
      }
      const result = generatePlanSchema.parse(input)
      expect(result.preferences).not.toContain('{{')
      expect(result.preferences).toBe('I like  food')
    })

    it('should strip EJS template syntax', () => {
      const input = {
        ...validInput,
        dislikes: '<% dangerous %> vegetables',
      }
      const result = generatePlanSchema.parse(input)
      expect(result.dislikes).not.toContain('<%')
      expect(result.dislikes).toBe('vegetables')
    })

    it('should strip ES6 template syntax', () => {
      const input = {
        ...validInput,
        preferences: 'Budget is ${budget}',
      }
      const result = generatePlanSchema.parse(input)
      expect(result.preferences).not.toContain('${')
      expect(result.preferences).toBe('Budget is')
    })

    it('should strip control characters except newline and tab', () => {
      const input = {
        ...validInput,
        allergies: 'Peanuts\x00\x01\x02 and shellfish',
      }
      const result = generatePlanSchema.parse(input)
      expect(result.allergies).toBe('Peanuts and shellfish')
    })
  })

  describe('boundary values', () => {
    it('should accept minimum age of 16', () => {
      const input = { ...validInput, age: 16 }
      const result = generatePlanSchema.parse(input)
      expect(result.age).toBe(16)
    })

    it('should reject age below 16', () => {
      const input = { ...validInput, age: 15 }
      expect(() => generatePlanSchema.parse(input)).toThrow('Age must be at least 16')
    })

    it('should accept maximum age of 100', () => {
      const input = { ...validInput, age: 100 }
      const result = generatePlanSchema.parse(input)
      expect(result.age).toBe(100)
    })

    it('should reject age above 100', () => {
      const input = { ...validInput, age: 101 }
      expect(() => generatePlanSchema.parse(input)).toThrow('Age must be 100 or less')
    })

    it('should accept name at max length (100 chars)', () => {
      const input = { ...validInput, name: 'A'.repeat(100) }
      const result = generatePlanSchema.parse(input)
      expect(result.name).toHaveLength(100)
    })

    it('should accept allergies at max length (500 chars)', () => {
      const input = { ...validInput, allergies: 'A'.repeat(500) }
      const result = generatePlanSchema.parse(input)
      expect(result.allergies).toHaveLength(500)
    })

    it('should reject allergies over max length', () => {
      const input = { ...validInput, allergies: 'A'.repeat(501) }
      expect(() => generatePlanSchema.parse(input)).toThrow()
    })
  })

  describe('required fields', () => {
    it('should reject empty name', () => {
      const input = { ...validInput, name: '' }
      expect(() => generatePlanSchema.parse(input)).toThrow('Client name is required')
    })

    it('should reject missing name', () => {
      const { name, ...inputWithoutName } = validInput
      expect(() => generatePlanSchema.parse(inputWithoutName)).toThrow()
    })

    it('should trim whitespace and validate', () => {
      const input = { ...validInput, name: '   John Doe   ' }
      const result = generatePlanSchema.parse(input)
      expect(result.name).toBe('John Doe')
    })

    it('should reject whitespace-only name', () => {
      const input = { ...validInput, name: '   ' }
      expect(() => generatePlanSchema.parse(input)).toThrow('Client name is required')
    })
  })

  describe('enum fields', () => {
    it('should accept valid gender values', () => {
      const maleInput = { ...validInput, gender: 'M' as const }
      const femaleInput = { ...validInput, gender: 'F' as const }

      expect(generatePlanSchema.parse(maleInput).gender).toBe('M')
      expect(generatePlanSchema.parse(femaleInput).gender).toBe('F')
    })

    it('should reject invalid gender', () => {
      const input = { ...validInput, gender: 'X' }
      expect(() => generatePlanSchema.parse(input)).toThrow('Gender must be M or F')
    })

    it('should accept all valid activity levels', () => {
      const levels = ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active']

      levels.forEach(level => {
        const input = { ...validInput, activity_level: level }
        expect(generatePlanSchema.parse(input).activity_level).toBe(level)
      })
    })

    it('should reject invalid activity level', () => {
      const input = { ...validInput, activity_level: 'super_active' }
      expect(() => generatePlanSchema.parse(input)).toThrow('Invalid activity level')
    })

    it('should accept all valid goals', () => {
      const goals = ['fat_loss', 'muscle_gain', 'maintenance', 'recomp']

      goals.forEach(goal => {
        const input = { ...validInput, goal }
        expect(generatePlanSchema.parse(input).goal).toBe(goal)
      })
    })

    it('should accept all valid dietary types', () => {
      const types = ['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo', 'gluten_free', 'dairy_free']

      types.forEach(type => {
        const input = { ...validInput, dietary_type: type }
        expect(generatePlanSchema.parse(input).dietary_type).toBe(type)
      })
    })

    it('should accept all valid cooking skills', () => {
      const skills = ['beginner', 'intermediate', 'advanced']

      skills.forEach(skill => {
        const input = { ...validInput, cooking_skill: skill }
        expect(generatePlanSchema.parse(input).cooking_skill).toBe(skill)
      })
    })

    it('should accept all valid meal prep styles', () => {
      const styles = ['daily', 'batch', 'mixed']

      styles.forEach(style => {
        const input = { ...validInput, meal_prep_style: style }
        expect(generatePlanSchema.parse(input).meal_prep_style).toBe(style)
      })
    })
  })

  describe('default values', () => {
    it('should default empty allergies to empty string', () => {
      const { allergies, ...inputWithoutAllergies } = validInput
      const result = generatePlanSchema.parse({ ...inputWithoutAllergies, allergies: '' })
      expect(result.allergies).toBe('')
    })

    it('should default empty dislikes to empty string', () => {
      const result = generatePlanSchema.parse({ ...validInput, dislikes: '' })
      expect(result.dislikes).toBe('')
    })

    it('should default empty preferences to empty string', () => {
      const result = generatePlanSchema.parse({ ...validInput, preferences: '' })
      expect(result.preferences).toBe('')
    })
  })

  describe('type coercion', () => {
    it('should coerce string age to number', () => {
      const input = { ...validInput, age: '25' as any }
      const result = generatePlanSchema.parse(input)
      expect(result.age).toBe(25)
      expect(typeof result.age).toBe('number')
    })

    it('should reject non-numeric age', () => {
      const input = { ...validInput, age: 'twenty-five' as any }
      expect(() => generatePlanSchema.parse(input)).toThrow()
    })
  })
})

describe('checkoutSchema', () => {
  it('should accept valid tier: starter', () => {
    const result = checkoutSchema.parse({ tier: 'starter' })
    expect(result.tier).toBe('starter')
  })

  it('should accept valid tier: pro', () => {
    const result = checkoutSchema.parse({ tier: 'pro' })
    expect(result.tier).toBe('pro')
  })

  it('should accept valid tier: agency', () => {
    const result = checkoutSchema.parse({ tier: 'agency' })
    expect(result.tier).toBe('agency')
  })

  it('should reject invalid tier', () => {
    expect(() => checkoutSchema.parse({ tier: 'enterprise' })).toThrow('Invalid subscription tier')
  })

  it('should reject missing tier', () => {
    expect(() => checkoutSchema.parse({})).toThrow()
  })
})
