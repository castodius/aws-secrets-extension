import { next, register } from "./extensionsApi.js";
import { logger } from './logging.js';
import { startServer } from "./server.js";

startServer()

const main = async () => {
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
