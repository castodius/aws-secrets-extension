import { describe, it, expect } from 'vitest'

import { BadRequestError } from '#lib/extension/errors.js'

describe('Errors helper', () => {
  describe('BadRequestError', () => {
    it('should set status 400 and message', () => {
      const error = new BadRequestError('hello')

      expect(error.message).toEqual('hello')
      expect(error.status).toEqual(400)
    })
  })
})