import { variables } from "./env.js"
import { next, register } from "./extensionsApi.js"
import { logger } from './logging.js'
import './server.js'
import { getSecretValue } from "./sm.js"
import { getParameter, getParameters } from "./ssm.js"

const main = async () => {
  logger.info({
    message: 'Parsed variables',
    variables,
  })
  logger.debug('Registering extension')
  const extensionId = await register()
  logger.debug({
    extensionId,
  })

  if (variables.PREFETCH_SSM_GET_PARAMETERS.length) {
    logger.info('Prefetching SSM parameters using GetParameters request')
    await getParameters({
      names: variables.PREFETCH_SSM_GET_PARAMETERS,
      withDecryption: 'true',
    })
  }

  if (variables.PREFETCH_SSM_GET_PARAMETER.length) {
    logger.info('Prefetching SSM parameters using individual GetParameter requests')
    await Promise.all(
      variables.PREFETCH_SSM_GET_PARAMETER
        .map((parameterName) => getParameter({ parameterName, withDecryption: 'true', }))
    )
  }

  if (variables.PREFETCH_SM_GET_SECRET_VALUE.length) {
    logger.info('Prefetching Secrets Manager secret values')
    await Promise.all(
      variables.PREFETCH_SM_GET_SECRET_VALUE
        .map((secretId) => getSecretValue({ secretId, }))
    )
  }

  while (true) {
    logger.debug('Waiting for next invocation')
    await next(extensionId!)
  }
}
main()
