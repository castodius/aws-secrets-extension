import { exec, execSync } from "child_process"
import waitOn from "wait-on"

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

interface Params {
  readonly projectName: string
  readonly lambdaEnvPort: number
  readonly localExtensionPort: number
  readonly ssmGetParameterPreFetch?: string
  readonly ssmGetParametersPreFetch?: string
}

export const before = (params: Params) => async () => {
  const { projectName, lambdaEnvPort, localExtensionPort, ssmGetParameterPreFetch, ssmGetParametersPreFetch, } = params

  const commands = [
    `export LAMBDA_ENVIRONMENT_PORT=${lambdaEnvPort}`,
    `export LOCAL_EXTENSION_PORT=${localExtensionPort}`
  ]
  if (ssmGetParameterPreFetch) {
    commands.push(`export PREFETCH_SSM_GET_PARAMETER=${ssmGetParameterPreFetch}`)
  }
  if (ssmGetParametersPreFetch) {
    commands.push(`export PREFETCH_SSM_GET_PARAMETERS=${ssmGetParametersPreFetch}`)
  }
  commands.push(`docker compose --file local/compose.yml --project-name ${projectName} up -d`)

  exec(commands.join(' && '))
  await waitOn({
    resources: [
      `tcp:${localExtensionPort}`
    ],
  })
  await sleep(2000)
}

export const after = (projectName: string) => () => {
  execSync(`docker compose --file local/compose.yml --project-name ${projectName} down`)
}

export const call = (port: number) => async (path: string, headers?: Headers) => {
  const workingHeaders = new Headers()
  workingHeaders.append('X-Secrets-Extension-Token', 'local-testing')

  const response = await fetch(`http://localhost:${port}${path}`, {
    headers: headers ?? workingHeaders,
  })

  const output = await response.json()
  const cachedAt = response.headers.get('X-Secrets-Extension-Cached-At')
  const cacheKey = response.headers.get('X-Secrets-Extension-Cache-Key')
  const isCached = response.headers.get('X-Secrets-Extension-Is-Cached')

  return {
    output,
    status: response.status,
    cachedAt,
    cacheKey,
    isCached,
  }
}

export const getHelpers = (params: Params) => ({
  before: before(params),
  after: after(params.projectName),
  call: call(params.localExtensionPort),
})
