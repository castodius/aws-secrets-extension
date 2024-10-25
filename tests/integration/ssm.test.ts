import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getHelpers } from './tools'

describe('SSM Parameter Store', () => {
  const { before, after, call, } = getHelpers({
    projectName: 'ssm',
    lambdaEnvPort: 3002,
    localExtensionPort: 3003,
    ssmGetParameterPreFetch: 'so-secret',
    ssmGetParametersPreFetch: 'so-secret,my-parameter',
  })

  beforeAll(async () => {
    await before()
  })

  afterAll(() => {
    after()
  })

  describe('Get parameter', () => {
    let previousCachedAt: string
    it('should return full AWS API response', async () => {
      const { output, status, cachedAt, } = await call('/ssm/parameters/my-parameter')

      expect(status).toEqual(200)
      expect(output).toEqual({
        '$metadata': {
          attempts: expect.any(Number),
          httpStatusCode: 200,
          requestId: expect.stringMatching(/^[0-9a-f-]+$/),
          totalRetryDelay: expect.any(Number),
        },
        Parameter: {
          ARN: expect.stringMatching(/.*/),
          DataType: 'text',
          LastModifiedDate: expect.stringMatching(/.*/),
          Name: 'my-parameter',
          Type: 'String',
          Value: 'wow, so cool',
          Version: 2,
        },
      })
      previousCachedAt = cachedAt!
    })

    it('should return cached value', async () => {
      const { output, status, cachedAt, } = await call('/ssm/parameters/my-parameter')

      expect(status).toEqual(200)
      expect(output.Parameter.Value).toEqual('wow, so cool')
      expect(cachedAt).toEqual(previousCachedAt)
    })

    it('should handle hierarchies', async () => {
      const { output, status, } = await call('/ssm/parameters/%2Fa%2Fb')

      expect(status).toEqual(200)
      expect(output.Parameter.Value).toEqual('cool value!')
    })

    it('should set cache key', async () => {
      const { status, cacheKey, } = await call('/ssm/parameters/my-parameter?cacheKey=foo')

      expect(status).toEqual(200)
      expect(cacheKey).toEqual('foo')
    })

    it('should disable caching', async () => {
      const { status, isCached, } = await call('/ssm/parameters/my-parameter?cacheKey=bar&ttl=0')

      expect(status).toEqual(200)
      expect(isCached).toEqual('false')
    })

    it('should pre-fetch value', async () => {
      const start = +new Date()
      const { output, status, } = await call('/ssm/parameters/so-secret?withDecryption=true')
      const end = +new Date()

      expect(status).toEqual(200)
      expect(output.Parameter.Value).toEqual('wowow')
      expect(end - start).toBeLessThan(20)
    })

    it('should handle SecureString', async () => {
      const { output, status, } = await call('/ssm/parameters/so-secret?withDecryption=true&cacheKey=another')

      expect(status).toEqual(200)
      expect(output.Parameter.Value).toEqual('wowow')
    })

    it('should fetch from different region', async () => {
      const { output, status, } = await call('/ssm/parameters/my-param?withDecryption=true&region=us-east-1')

      expect(status).toEqual(200)
      expect(output.Parameter.Value).toEqual('USA')
    })
  })

  describe('Get parameters by name', () => {
    let previousCachedAt: string
    it('should return full AWS API response', async () => {
      const { output, status, cachedAt, } = await call('/ssm/parameters?names=so-secret,%2Fa%2Fb&withDecryption=true')

      expect(status).toEqual(200)
      expect(output).toEqual({
        '$metadata': {
          attempts: expect.any(Number),
          httpStatusCode: 200,
          requestId: expect.stringMatching(/^[0-9a-f-]+$/),
          totalRetryDelay: expect.any(Number),
        },
        Parameters: [
          {
            ARN: expect.stringMatching(/.*/),
            DataType: 'text',
            LastModifiedDate: expect.stringMatching(/.*/),
            Name: '/a/b',
            Type: 'String',
            Value: 'cool value!',
            Version: 1,
          },
          {
            ARN: expect.stringMatching(/.*/),
            DataType: 'text',
            LastModifiedDate: expect.stringMatching(/.*/),
            Name: 'so-secret',
            Type: 'SecureString',
            Value: 'wowow',
            Version: 1,
          }
        ],
        InvalidParameters: [],
      })
      previousCachedAt = cachedAt!
    })

    it('should return cached value when using single value query parameter', async () => {
      const { status, cachedAt, } = await call('/ssm/parameters?names=so-secret,%2Fa%2Fb&withDecryption=true')

      expect(status).toEqual(200)
      expect(cachedAt).toEqual(previousCachedAt)
    })

    it('should return cached value when using single value query parameter - other order', async () => {
      const { status, cachedAt, } = await call('/ssm/parameters?names=%2Fa%2Fb,so-secret&withDecryption=true')

      expect(status).toEqual(200)
      expect(cachedAt).toEqual(previousCachedAt)
    })

    it('should return cached value when using multi value query parameter', async () => {
      const { status, cachedAt, } = await call('/ssm/parameters?names=%2Fa%2Fb&names=so-secret&withDecryption=true')

      expect(status).toEqual(200)
      expect(cachedAt).toEqual(previousCachedAt)
    })

    it('should set cache key', async () => {
      const { status, cacheKey, } = await call('/ssm/parameters?names=%2Fa%2Fb,so-secret&withDecryption=true&cacheKey=baz')

      expect(status).toEqual(200)
      expect(cacheKey).toEqual('baz')
    })

    it('should disable caching', async () => {
      const { status, isCached, } = await call('/ssm/parameters?names=%2Fa%2Fb,so-secret&withDecryption=true&cacheKey=nope&ttl=0')

      expect(status).toEqual(200)
      expect(isCached).toEqual('false')
    })

    it('should pre-fetch values', async () => {
      const start = +new Date()
      const { output, status, } = await call('/ssm/parameters?names=so-secret,my-parameter&withDecryption=true')
      const end = +new Date()

      expect(status).toEqual(200)
      expect(output.Parameters[0]).toMatchObject({
        Value: 'wow, so cool',
      })
      expect(output.Parameters[1]).toMatchObject({
        Value: 'wowow',
      })
      expect(end - start).toBeLessThan(20)
    })

    it('should fetch from different region', async () => {
      const { output, status, } = await call('/ssm/parameters?names=my-param&region=us-east-1&withDecryption=true')

      expect(status).toEqual(200)
      expect(output.Parameters[0].Value).toEqual('USA')
    })
  })
})
