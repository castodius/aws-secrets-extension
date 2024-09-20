import { describe, it, expect } from 'vitest'

import { getVariable, getVariableBoolean, getVariableEnum, getVariableInt } from '#lib/extension/env.js'

describe('Environment variable helper', () => {
  describe('getVariable', () => {
    it('should return variable', () => {
      process.env.AWS_SECRETS_EXTENSION_FIRST = 'bar'

      const output = getVariable('FIRST')

      expect(output).toEqual('bar')
    })

    it('should return variable when AWS_SECRETS_EXTENSIONS_PREFIX is set', () => {
      process.env.AWS_SECRETS_EXTENSION_PREFIX = 'GET_VARIABLE'
      process.env.GET_VARIABLE_FOO = 'bar'

      const output = getVariable('FOO')

      expect(output).toEqual('bar')
    })
  })

  describe('getVariableInt', () => {
    it('should parse int', () => {
      process.env.AWS_SECRETS_EXTENSION_PREFIX = 'GET_VARIABLE_INT'
      process.env.GET_VARIABLE_INT_WORKING = '5'

      const output = getVariableInt('WORKING', 7)

      expect(output).toEqual(5)
    })

    it('should return default value is not set', () => {
      process.env.AWS_SECRETS_EXTENSION_PREFIX = 'GET_VARIABLE_INT'

      const output = getVariableInt('NOPE', 7)

      expect(output).toEqual(7)
    })

    it('should return default value if the variable can not be parsed as int', () => {
      process.env.AWS_SECRETS_EXTENSION_PREFIX = 'GET_VARIABLE_INT'
      process.env.GET_VARIABLE_INT_BROKEN = 'hello'

      const output = getVariableInt('BROKEN', 7)

      expect(output).toEqual(7)
    })
  })

  describe('getVariableBoolean', () => {
    it('should parse boolean - true', () => {
      process.env.AWS_SECRETS_EXTENSION_PREFIX = 'GET_VARIABLE_BOOLEAN'
      process.env.GET_VARIABLE_BOOLEAN_WORKING = 'true'

      const output = getVariableBoolean('WORKING', false)

      expect(output).toEqual(true)
    })

    it('should parse boolean - false', () => {
      process.env.AWS_SECRETS_EXTENSION_PREFIX = 'GET_VARIABLE_BOOLEAN'
      process.env.GET_VARIABLE_BOOLEAN_WORKING = 'false'

      const output = getVariableBoolean('WORKING', true)

      expect(output).toEqual(false)
    })

    it('should return default value if variable is not set', () => {
      process.env.AWS_SECRETS_EXTENSION_PREFIX = 'GET_VARIABLE_BOOLEAN'

      const output = getVariableBoolean('NOPE', true)

      expect(output).toEqual(true)
    })

    it('should return default value if variable can not be parsed as boolean', () => {
      process.env.AWS_SECRETS_EXTENSION_PREFIX = 'GET_VARIABLE_BOOLEAN'
      process.env.GET_VARIABLE_BOOLEAN_BROKEN = 'nope'

      const output = getVariableBoolean('BROKEN', true)

      expect(output).toEqual(true)
    })
  })

  describe('getVariableEnum', () => {
    it('should parse enum', () => {
      process.env.AWS_SECRETS_EXTENSION_PREFIX = 'GET_VARIABLE_ENUM'
      process.env.GET_VARIABLE_ENUM_WORKING = 'b'

      const output = getVariableEnum('WORKING', ['a', 'b', 'c'], 'c')

      expect(output).toEqual('b')
    })

    it('should return default value if variable is not set', () => {
      process.env.AWS_SECRETS_EXTENSION_PREFIX = 'GET_VARIABLE_ENUM'

      const output = getVariableEnum('NOPE', ['a', 'b', 'c'], 'c')

      expect(output).toEqual('c')
    })

    it('should return default value if variable is not part of enum', () => {
      process.env.AWS_SECRETS_EXTENSION_PREFIX = 'GET_VARIABLE_ENUM'
      process.env.GET_VARIABLE_ENUM_BROKEN = 'nope'

      const output = getVariableEnum('BROKEN', ['a', 'b', 'c'], 'c')

      expect(output).toEqual('c')
    })
  })
})