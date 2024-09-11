import { describe, expect, it, vi } from "vitest";

import { LogFormat, Logger, LogLevel } from '#lib/extension/logging.js'

/**
 * The Logger class logs information as part of the constructor. We reset the mock function after each instantiation to handle this. 
 */

describe('Logger', () => {
  const setupLogger = (format: LogFormat, level: LogLevel) => {
    const fn = vi.fn()
    const logger = new Logger(format, level, fn)
    fn.mockRestore()
    return { fn, logger }
  }

  describe('formatting', () => {
    it('should handle JSON setting and JSON', () => {
      const { fn, logger } = setupLogger('json', 'debug')

      logger.debug({ a: 4711 })

      expect(JSON.parse(fn.mock.calls[0][0])).toEqual({ a: 4711, "level": "debug" })
    })

    it('should handle JSON setting and string', () => {
      const { fn, logger } = setupLogger('json', 'debug')

      logger.debug('hello')

      expect(JSON.parse(fn.mock.calls[0][0])).toEqual({ "message": "hello", "level": "debug" })
    })

    it('should handle text setting and JSON', () => {
      const { fn, logger } = setupLogger('text', 'debug')

      logger.debug({ a: 4711 })

      expect(fn.mock.calls[0][0]).toEqual('[DEBUG]: {"a":4711}')
    })

    it('should handle text setting and text', () => {
      const {fn, logger} =  setupLogger('text', 'debug')

      logger.debug('hello')

      expect(fn.mock.calls[0][0]).toEqual('[DEBUG]: hello')
    })
  })

  describe('log level', () => {
    it('should handle log level debug', () => {
      const {fn, logger} =  setupLogger('json', 'debug')

      logger.debug('wow')
      logger.info('wow')
      logger.warn('wow')
      logger.error('wow')

      expect(fn.mock.calls).toHaveLength(4)
    })

    it('should handle log level info', () => {
      const {fn, logger} =  setupLogger('json', 'info')


      logger.debug('wow')
      logger.info('wow')
      logger.warn('wow')
      logger.error('wow')

      expect(fn.mock.calls).toHaveLength(3)
    })

    it('should handle log level warn', () => {
      const {fn, logger} = setupLogger('json', 'warn')

      logger.debug('wow')
      logger.info('wow')
      logger.warn('wow')
      logger.error('wow')

      expect(fn.mock.calls).toHaveLength(2)
    })

    it('should handle log level error', () => {
      const {fn, logger} =  setupLogger('json', 'error')

      logger.debug('wow')
      logger.info('wow')
      logger.warn('wow')
      logger.error('wow')

      expect(fn.mock.calls).toHaveLength(1)
    })
  })
})
