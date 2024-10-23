import { exec, execSync } from "child_process"
import waitOn from "wait-on"

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

interface StartDockerParams {
  readonly projectName: string
  readonly lambdaEnvPort: number
  readonly localExtensionPort: number
  readonly ssmGetParameterPreFetch?: string
  readonly ssmGetParametersPreFetch?: string
}

export const startDocker = async (params: StartDockerParams) => {
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

export const stopDocker = (projectName: string) => {
  execSync(`docker compose --file local/compose.yml --project-name ${projectName} down`)
}
