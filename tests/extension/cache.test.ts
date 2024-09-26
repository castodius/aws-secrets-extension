import { describe, it, expect } from 'vitest'

import { Cache } from '#lib/extension/cache.js'

describe('Cache', () => {
  describe('add', () => {
    it('should add an item', () => {
      const cache = new Cache(1000, true)

      const output = cache.add({
        key: 'k',
        service: 's',
        item: 'wow'
      })

      expect(output).toEqual('wow')
      expect(cache.size()).toEqual(1)
    })

    it('should not add an item if cache size is set to 0', () => {
      const cache = new Cache(0, true)

      const output = cache.add({
        key: 'k',
        service: 's',
        item: 'wow'
      })

      expect(output).toEqual('wow')
      expect(cache.size()).toEqual(0)
    })

    it('should not add an item if cache is disabled', () => {
      const cache = new Cache(0, false)

      const output = cache.add({
        key: 'k',
        service: 's',
        item: 'wow'
      })

      expect(output).toEqual('wow')
      expect(cache.size()).toEqual(0)
    })
  })

  describe('get', () => {
    it('should return cached items', async () => {
      const cache = new Cache(1000, true)

      cache.add({
        key: 'k',
        service: 's',
        item: 'wow'
      })
      const output = cache.get({
        key: 'k',
        service: 's'
      })

      expect(output).toEqual('wow')
    })

    it('should nothing if nothing is found', () => {
      const cache = new Cache(1000, true)

      const output = cache.get({
        key: 'k',
        service: 's'
      })

      expect(output).toEqual(undefined)
    })
  })

  describe('getOrAdd', () => {
    it('should get and add item', async () => {
      const cache = new Cache(1000, true)

      const output = await cache.getOrRetrieve({
        key: 'k',
        service: 's',
        getter: () => Promise.resolve('wow')
      })

      expect(output).toEqual('wow')
    })

    it('should return already cached item', async () => {
      const cache = new Cache(1000, true)

      cache.add({
        key: 'k',
        service: 's',
        item: 'wow'
      })
      const output = await cache.getOrRetrieve({
        key: 'k',
        service: 's',
        getter: () => Promise.resolve('wow')
      })

      expect(output).toEqual('wow')
    })
  })
})
