import { exec, execSync } from 'child_process'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import waitOn from 'wait-on'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe('Auth', () => {
  beforeAll(async () => {
    exec('docker compose --file local/compose.yml up -d')
    await waitOn({
      resources: [
        'tcp:3000'
      ],
    })
    await sleep(2000)
  })

  afterAll(() => {
    execSync('docker compose --file local/compose.yml down')
  })

  it('should handle missing auth header', async () => {
    const output = await fetch('http://localhost:2773/ssm/parameters/nope')

    expect(output.status).toEqual(401)
    expect(await output.json()).toEqual({
      message: 'Missing auth header "X-Secrets-Extension-Token"',
    })
  })
  
  it('should handle bad auth header', async () => {
    const headers = new Headers()
    headers.append('X-Secrets-Extension-Token', 'nope')
    const output = await fetch('http://localhost:2773/ssm/parameters/nope', {
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
    const output = await fetch('http://localhost:2773/nope', {
      headers,
    })
    
    expect(output.status).toEqual(404)
    expect(await output.json()).toEqual({
      message: 'No such resource, please review documentation for available resources',
    })
  })
})
