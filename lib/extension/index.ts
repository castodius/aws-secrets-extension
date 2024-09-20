import { variables } from "./env.js";
import { next, register } from "./extensionsApi.js";
import { logger } from './logging.js';
import './server.js'

const main = async () => {
  logger.info({
    message: 'Parsed variables',
    variables
  })
  logger.debug('Registering extension')
  const extensionId = await register();
  logger.debug({
    extensionId
  })

  while (true) {
    logger.debug('Waiting for next invocation')
    await next(extensionId!)
  }
}
main()
