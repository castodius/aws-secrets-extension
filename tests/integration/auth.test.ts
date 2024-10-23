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
    const output = await call('/ssm/parameters/nope', new Headers())

    expect(output.status).toEqual(401)
    expect(await output.json()).toEqual({
      message: 'Missing auth header "X-Secrets-Extension-Token"',
    })
  })

  it('should handle bad auth header', async () => {
    const headers = new Headers()
    headers.append('X-Secrets-Extension-Token', 'nope')
    const output = await call('/ssm/parameters/nope', headers)

    expect(output.status).toEqual(401)
    expect(await output.json()).toEqual({
      message: 'Supplied auth header has incorrect value',
    })
  })

  it('should handle non-existing resources', async () => {
    const output = await fetch('http://localhost:3001/nope')

    expect(output.status).toEqual(404)
    expect(await output.json()).toEqual({
      message: 'No such resource, please review documentation for available resources',
    })
  })
})
