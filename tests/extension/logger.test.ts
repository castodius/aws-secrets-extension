import { describe, expect, it, vi } from "vitest";

import { Logger } from '#lib/extension/logging.js'

describe('Logger', () => {
  describe('formatting', () => {
    it('should handle JSON setting and JSON', () => {
      const fn = vi.fn()
      const logger = new Logger('json', 'debug', fn)

      logger.debug({ a: 4711 })

      expect(JSON.parse(fn.mock.calls[0][0])).toEqual({ a: 4711, "level": "debug" })
    })

    it('should handle JSON setting and string', () => {
      const fn = vi.fn()
      const logger = new Logger('json', 'debug', fn)

      logger.debug('hello')

      expect(JSON.parse(fn.mock.calls[0][0])).toEqual({ "message": "hello", "level": "debug" })
    })

    it('should handle text setting and JSON', () => {
      const fn = vi.fn()
      const logger = new Logger('text', 'debug', fn)

      logger.debug({ a: 4711 })

      expect(fn.mock.calls[0][0]).toEqual('[DEBUG]: {"a":4711}')
    })

    it('should handle text setting and text', () => {
      const fn = vi.fn()
      const logger = new Logger('text', 'debug', fn)

      logger.debug('hello')

      expect(fn.mock.calls[0][0]).toEqual('[DEBUG]: hello')
    })
  })

  describe('log level', () => {
    it('should handle log level debug', () => {
      const fn = vi.fn()
      const logger = new Logger('json', 'debug', fn)

      logger.debug('wow')
      logger.info('wow')
      logger.warn('wow')
      logger.error('wow')

      expect(fn.mock.calls).toHaveLength(4)
    })

    it('should handle log level info', () => {
      const fn = vi.fn()
      const logger = new Logger('json', 'info', fn)

      logger.debug('wow')
      logger.info('wow')
      logger.warn('wow')
      logger.error('wow')

      expect(fn.mock.calls).toHaveLength(3)
    })

    it('should handle log level warn', () => {
      const fn = vi.fn()
      const logger = new Logger('json', 'warn', fn)

      logger.debug('wow')
      logger.info('wow')
      logger.warn('wow')
      logger.error('wow')

      expect(fn.mock.calls).toHaveLength(2)
    })

    it('should handle log level error', () => {
      const fn = vi.fn()
      const logger = new Logger('json', 'error', fn)

      logger.debug('wow')
      logger.info('wow')
      logger.warn('wow')
      logger.error('wow')

      expect(fn.mock.calls).toHaveLength(1)
    })
  })
})
