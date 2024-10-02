import { describe, it, expect, vi, beforeEach } from 'vitest'

import { Cache, INFINITE_TTL } from '#lib/extension/cache.js'

describe('Cache', () => {
  beforeEach(() => {
    const date = new Date(1727370000000)
    vi.setSystemTime(date)
  })

  describe('add', () => {
    it('should add an item', () => {
      const cache = new Cache(1000, true)

      const output = cache.add({
        key: 'k',
        service: 's',
        item: 'wow',
        ttl: 10,
      })

      expect(output).toEqual({
        key: 'k',
        "addedAt": 1727370000,
        "cached": true,
        "item": "wow",
        "expiresAt": 1727370010,
      })
      expect(cache.size()).toEqual(1)
    })

    it('should handle infinite TTL', () => {
      const cache = new Cache(1000, true)

      const output = cache.add({
        key: 'k',
        service: 's',
        item: 'wow',
        ttl: INFINITE_TTL,
      })

      expect(output).toEqual({
        key: 'k',
        "addedAt": 1727370000,
        "cached": true,
        "item": "wow",
        "expiresAt": -1,
      })
      expect(cache.size()).toEqual(1)
    })

    it('should not add an item if cache size is set to 0', () => {
      const cache = new Cache(0, true)

      const output = cache.add({
        key: 'k',
        service: 's',
        item: 'wow',
        ttl: 10,
      })

      expect(output).toEqual({
        key: 'k',
        "addedAt": 0,
        "cached": false,
        "item": "wow",
        "expiresAt": 0,
      })
      expect(cache.size()).toEqual(0)
    })

    it('should not add an item if cache is disabled', () => {
      const cache = new Cache(0, false)

      const output = cache.add({
        key: 'k',
        service: 's',
        item: 'wow',
        ttl: 10,
      })

      expect(output).toEqual({
        key: 'k',
        "addedAt": 0,
        "cached": false,
        "item": "wow",
        "expiresAt": 0,
      })
      expect(cache.size()).toEqual(0)
    })

    it('should not add an item if TTL is 0', () => {
      const cache = new Cache(0, true)

      const output = cache.add({
        key: 'k',
        service: 's',
        item: 'wow',
        ttl: 0,
      })

      expect(output).toEqual({
        key: 'k',
        "addedAt": 0,
        "cached": false,
        "item": "wow",
        "expiresAt": 0,
      })
      expect(cache.size()).toEqual(0)
    })
  })

  describe('get', () => {
    it('should return cached items', async () => {
      const cache = new Cache(1000, true)

      cache.add({
        key: 'k',
        service: 's',
        item: 'wow',
        ttl: 10,
      })
      const output = cache.get({
        key: 'k',
        service: 's',
      })

      expect(output).toEqual({
        key: 'k',
        "addedAt": 1727370000,
        "cached": true,
        "item": "wow",
        "expiresAt": 1727370010,
      })
    })

    it('should keep items with TTL set to infinity for forever', async () => {
      const cache = new Cache(1000, true)
      cache.add({
        key: 'k',
        service: 's',
        item: 'wow',
        ttl: INFINITE_TTL,
      })
      const date = new Date(3024, 8, 26, 19)
      vi.setSystemTime(date)

      const output = cache.get({
        key: 'k',
        service: 's',
      })

      expect(output).toEqual({
        key: 'k',
        "addedAt": 1727370000,
        "cached": true,
        "item": "wow",
        "expiresAt": -1,
      })
    })

    it('should nothing if nothing is found', () => {
      const cache = new Cache(1000, true)

      const output = cache.get({
        key: 'k',
        service: 's',
      })

      expect(output).toEqual(undefined)
    })

    it('should return nothing if item has expired', () => {
      const cache = new Cache(1000, true)
      cache.add({
        key: 'k',
        service: 's',
        item: 'wow',
        ttl: 10,
      })
      // one hour later
      const date = new Date(1727373600000)
      vi.setSystemTime(date)

      const output = cache.get({
        key: 'k',
        service: 's',
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
        getter: () => Promise.resolve('wow'),
        ttl: 10,
      })

      expect(output).toEqual({
        key: 'k',
        "addedAt": 1727370000,
        "cached": true,
        "item": "wow",
        "expiresAt": 1727370010,
      })
    })

    it('should return already cached item', async () => {
      const cache = new Cache(1000, true)

      cache.add({
        key: 'k',
        service: 's',
        item: 'wow',
        ttl: 10,
      })
      const output = await cache.getOrRetrieve({
        key: 'k',
        service: 's',
        getter: () => Promise.resolve('wow'),
        ttl: 10,
      })

      expect(output).toEqual({
        key: 'k',
        "addedAt": 1727370000,
        "cached": true,
        "item": "wow",
        "expiresAt": 1727370010,
      })
    })
  })

  describe('createCacheKey', () => {
    it('should include all keys', () => {
      const output = Cache.createCacheKey({
        a: 47,
        b: 'hello',
      })

      expect(output).toEqual('{"a":47,"b":"hello"}')
    })

    it('should sort keys', () => {
      const output = Cache.createCacheKey({
        b: 'hello',
        a: 47,
      })

      expect(output).toEqual('{"a":47,"b":"hello"}')
    })

    it('should sort deep keys', () => {
      const output = Cache.createCacheKey({
        d: {
          e: 1,
          f: 4,
        },
        a: {
          c: 2,
          d: 3,
        },
      })

      expect(output).toEqual('{"a":{"c":2,"d":3},"d":{"e":1,"f":4}}')
    })
  })
})
