import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getHelpers } from './tools'


describe('Auth', () => {
  const { before, after, call, } = getHelpers({
    projectName: 'auth',
    lambdaEnvPort: 3000,
    localExtensionPort: 3001,
  })

  beforeAll(async () => {
    await before()
  })

  afterAll(() => {
    after()
  })

  it('should handle missing auth header', async () => {
    const { output, status, } = await call('/ssm/parameters/nope', new Headers())

    expect(status).toEqual(401)
    expect(output).toEqual({
      message: 'Missing auth header "X-Secrets-Extension-Token"',
    })
  })

  it('should handle bad auth header', async () => {
    const headers = new Headers()
    headers.append('X-Secrets-Extension-Token', 'nope')
    const { output, status, } = await call('/ssm/parameters/nope', headers)

    expect(status).toEqual(401)
    expect(output).toEqual({
      message: 'Supplied auth header has incorrect value',
    })
  })

  it('should handle non-existing resources', async () => {
    const { output, status, } = await call('/nope')

    expect(status).toEqual(404)
    expect(output).toEqual({
      message: 'No such resource, please review documentation for available resources',
    })
  })
})
