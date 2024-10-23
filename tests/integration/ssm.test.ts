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
    let cachedAt: string
    it('should return full AWS API response', async () => {
      const response = await call('/ssm/parameters/my-parameter')

      expect(response.status).toEqual(200)
      const output = await response.json()
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
      cachedAt = response.headers.get('X-Secrets-Extension-Cached-At')!
    })

    it('should return cached value', async () => {
      const response = await call('/ssm/parameters/my-parameter')

      expect(response.status).toEqual(200)
      const output = await response.json()
      expect(output.Parameter.Value).toEqual('wow, so cool')
      expect(response.headers.get('X-Secrets-Extension-Cached-At')).toEqual(cachedAt)
    })

    it('should handle hierarchies', async () => {
      const response = await call('/ssm/parameters/%2Fa%2Fb')

      expect(response.status).toEqual(200)
      const output = await response.json()
      expect(output.Parameter.Value).toEqual('cool value!')
    })

    it('should set cache key', async () => {
      const response = await call('/ssm/parameters/my-parameter?cacheKey=foo')

      expect(response.status).toEqual(200)
      expect(response.headers.get('X-Secrets-Extension-Cache-Key')).toEqual('foo')
    })

    it('should disable caching', async () => {
      const response = await call('/ssm/parameters/my-parameter?cacheKey=bar&ttl=0')

      expect(response.status).toEqual(200)
      expect(response.headers.get('X-Secrets-Extension-Is-Cached')).toEqual('false')
    })

    it('should pre-fetch value', async () => {
      const start = +new Date()
      const response = await call('/ssm/parameters/so-secret?withDecryption=true')
      const end = +new Date()

      expect(response.status).toEqual(200)
      const output = await response.json()
      expect(output.Parameter.Value).toEqual('wowow')
      expect(end - start).toBeLessThan(20)
    })

    it('should handle SecureString', async () => {
      const response = await call('/ssm/parameters/so-secret?withDecryption=true&cacheKey=another')

      expect(response.status).toEqual(200)
      const output = await response.json()
      expect(output.Parameter.Value).toEqual('wowow')
    })

    it('should fetch from different region', async () => {
      const response = await call('/ssm/parameters/my-param?withDecryption=true&region=us-east-1')

      expect(response.status).toEqual(200)
      const output = await response.json()
      expect(output.Parameter.Value).toEqual('USA')
    })
  })

  describe('Get parameters by name', () => {
    let cachedAt: string
    it('should return full AWS API response', async () => {
      const response = await call('/ssm/parameters?names=so-secret,%2Fa%2Fb&withDecryption=true')

      expect(response.status).toEqual(200)
      const output = await response.json()
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
      cachedAt = response.headers.get('X-Secrets-Extension-Cached-At')!
    })

    it('should return cached value when using single value query parameter', async () => {
      const response = await call('/ssm/parameters?names=so-secret,%2Fa%2Fb&withDecryption=true')

      expect(response.status).toEqual(200)
      expect(response.headers.get('X-Secrets-Extension-Cached-At')).toEqual(cachedAt)
    })

    it('should return cached value when using single value query parameter - other order', async () => {
      const response = await call('/ssm/parameters?names=%2Fa%2Fb,so-secret&withDecryption=true')

      expect(response.status).toEqual(200)
      expect(response.headers.get('X-Secrets-Extension-Cached-At')).toEqual(cachedAt)
    })

    it('should return cached value when using multi value query parameter', async () => {
      const response = await call('/ssm/parameters?names=%2Fa%2Fb&names=so-secret&withDecryption=true')

      expect(response.status).toEqual(200)
      expect(response.headers.get('X-Secrets-Extension-Cached-At')).toEqual(cachedAt)
    })

    it('should set cache key', async () => {
      const response = await call('/ssm/parameters?names=%2Fa%2Fb,so-secret&withDecryption=true&cacheKey=baz')

      expect(response.status).toEqual(200)
      expect(response.headers.get('X-Secrets-Extension-Cache-Key')).toEqual('baz')
    })

    it('should disable caching', async () => {
      const response = await call('/ssm/parameters?names=%2Fa%2Fb,so-secret&withDecryption=true&cacheKey=nope&ttl=0')

      expect(response.status).toEqual(200)
      expect(response.headers.get('X-Secrets-Extension-Is-Cached')).toEqual('false')
    })

    it('should pre-fetch values', async () => {
      const start = +new Date()
      const response = await call('/ssm/parameters?names=so-secret,my-parameter&withDecryption=true')
      const end = +new Date()

      expect(response.status).toEqual(200)
      const output = await response.json()
      expect(output.Parameters[0]).toMatchObject({
        Value: 'wow, so cool',
      })
      expect(output.Parameters[1]).toMatchObject({
        Value: 'wowow',
      })
      expect(end - start).toBeLessThan(20)
    })

    it('should fetch from different region', async () => {
      const response = await call('/ssm/parameters?names=my-param&region=us-east-1&withDecryption=true')
  
      expect(response.status).toEqual(200)
      const output = await response.json()
      expect(output.Parameters[0].Value).toEqual('USA')
    })
  })
})
