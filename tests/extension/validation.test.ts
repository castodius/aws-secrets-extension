import { describe, it, expect } from 'vitest'
import z from 'zod'

import { stringBooleanSchema, stringIntegerSchema, validate } from '#lib/extension/validation.js'

describe('Validation helper', () => {
  describe('stringBooleanSchema', () => {
    it('should parse "true" to true', () => {
      const output = stringBooleanSchema.safeParse('true').data

      expect(output).toEqual(true)
    })

    it('should parse "false" to false', () => {
      const output = stringBooleanSchema.safeParse('false').data

      expect(output).toEqual(false)
    })

    it('should reject bad input', () => {
      const output = stringBooleanSchema.safeParse('banana').error

      expect(output).toBeDefined()
    })
  })

  describe('stringIntegerSchema', () => {
    it('should parse stringified number', () => {
      const output = stringIntegerSchema.safeParse('10').data

      expect(output).toEqual(10)
    })

    it('should reject bad input', () => {
      const output = stringIntegerSchema.safeParse('banana').error

      expect(output).toBeDefined()
    })
  })

  describe('validate', () => {
    it('should parse good input', () => {
      const schema = z.object({
        a: z.number()
      })

      const output = validate(schema, {
        a: 4711,
        b: true
      })

      expect(output).toEqual({
        a: 4711
      })
    })

    it('should throw for bad input', () => {
      const schema = z.object({
        a: z.number()
      })

      expect(() => validate(schema, {
        b: true
      })).toThrow()
    })
  })
})