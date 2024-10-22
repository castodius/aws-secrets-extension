import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { startDocker, stopDocker } from './tools'


describe('Auth', () => {
  beforeAll(async () => {
    await startDocker({
      projectName: 'auth',
      lambdaEnvPort: 3000,
      localExtensionPort: 3001,
    })
  })

  afterAll(() => {
    stopDocker('auth')
  })

  it('should handle missing auth header', async () => {
    const output = await fetch('http://localhost:3001/ssm/parameters/nope')

    expect(output.status).toEqual(401)
    expect(await output.json()).toEqual({
      message: 'Missing auth header "X-Secrets-Extension-Token"',
    })
  })
  
  it('should handle bad auth header', async () => {
    const headers = new Headers()
    headers.append('X-Secrets-Extension-Token', 'nope')
    const output = await fetch('http://localhost:3001/ssm/parameters/nope', {
      headers,
    })
    
    expect(output.status).toEqual(401)
    expect(await output.json()).toEqual({
      message: 'Supplied auth header has incorrect value',
    })
  })
  
  it('should handle non-existing resources', async () => {
    const headers = new Headers()
    headers.append('X-Secrets-Extension-Token', 'local-testing')
    const output = await fetch('http://localhost:3001/nope', {
      headers,
    })
    
    expect(output.status).toEqual(404)
    expect(await output.json()).toEqual({
      message: 'No such resource, please review documentation for available resources',
    })
  })
})
