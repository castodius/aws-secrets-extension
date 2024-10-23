import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { startDocker, stopDocker } from './tools'

describe('SSM Parameter Store', () => {
  beforeAll(async () => {
    await startDocker({
      projectName: 'ssm',
      lambdaEnvPort: 3002,
      localExtensionPort: 3003,
      ssmGetParameterPreFetch: 'so-secret',
    })
  })

  afterAll(() => {
    stopDocker('ssm')
  })

  describe('Get parameter', () => {
    let cachedAt: string
    it('should return full AWS API response', async () => {
      const headers = new Headers()
      headers.append('X-Secrets-Extension-Token', 'local-testing')

      const response = await fetch('http://localhost:3003/ssm/parameters/my-parameter', {
        headers,
      })

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
      const headers = new Headers()
      headers.append('X-Secrets-Extension-Token', 'local-testing')

      const response = await fetch('http://localhost:3003/ssm/parameters/my-parameter', {
        headers,
      })

      expect(response.status).toEqual(200)
      const output = await response.json()
      expect(output.Parameter.Value).toEqual('wow, so cool')
      expect(response.headers.get('X-Secrets-Extension-Cached-At')).toEqual(cachedAt)
    })

    it('should handle hierarchies', async () => {
      const headers = new Headers()
      headers.append('X-Secrets-Extension-Token', 'local-testing')

      const response = await fetch('http://localhost:3003/ssm/parameters/%2Fa%2Fb', {
        headers,
      })

      expect(response.status).toEqual(200)
      const output = await response.json()
      expect(output.Parameter.Value).toEqual('cool value!')
    })

    it('should set cache key', async () => {
      const headers = new Headers()
      headers.append('X-Secrets-Extension-Token', 'local-testing')

      const response = await fetch('http://localhost:3003/ssm/parameters/my-parameter?cacheKey=foo', {
        headers,
      })

      expect(response.status).toEqual(200)
      expect(response.headers.get('X-Secrets-Extension-Cache-Key')).toEqual('foo')
    })

    it('should disable caching', async () => {
      const headers = new Headers()
      headers.append('X-Secrets-Extension-Token', 'local-testing')

      const response = await fetch('http://localhost:3003/ssm/parameters/my-parameter?cacheKey=bar&ttl=0', {
        headers,
      })

      expect(response.status).toEqual(200)
      expect(response.headers.get('X-Secrets-Extension-Is-Cached')).toEqual('false')
    })

    it('should pre-fetch value', async () => {
      const headers = new Headers()
      headers.append('X-Secrets-Extension-Token', 'local-testing')

      const start = +new Date()
      const response = await fetch('http://localhost:3003/ssm/parameters/so-secret?withDecryption=true', {
        headers,
      })
      const end = +new Date()

      expect(response.status).toEqual(200)
      const output = await response.json()
      expect(output.Parameter.Value).toEqual('wowow')
      expect(end - start).toBeLessThan(20)
    })

    it('should handle SecureString', async () => {
      const headers = new Headers()
      headers.append('X-Secrets-Extension-Token', 'local-testing')

      const response = await fetch('http://localhost:3003/ssm/parameters/so-secret?withDecryption=true&cacheKey=another', {
        headers,
      })

      expect(response.status).toEqual(200)
      const output = await response.json()
      expect(output.Parameter.Value).toEqual('wowow')
    })

    it('should fetch from different region', async () => {
      const headers = new Headers()
      headers.append('X-Secrets-Extension-Token', 'local-testing')

      const response = await fetch('http://localhost:3003/ssm/parameters/my-param?withDecryption=true&region=us-east-1', {
        headers,
      })

      expect(response.status).toEqual(200)
      const output = await response.json()
      expect(output.Parameter.Value).toEqual('USA')
    })
  })
})
