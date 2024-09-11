import Koa from 'koa'
import Router from '@koa/router'

import { next, register } from "./extensionsApi.js";
import { getParameter, getParameters } from './ssm.js';
import { logger } from './logging.js';

const app = new Koa()
const router = new Router()

router.get('/systemsmanager/parameters/:parameterName', getParameter)
router.get('/ssm/parameters/:parameterName', getParameter)
router.get('/systemsmanager/parameters', getParameters)
router.get('/ssm/parameters', getParameters)
app
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(3000)

const main = async () => {
  logger.debug('Registering extension')
  const extensionId = await register();
  logger.debug({
    extensionId
  })

  logger.info('Server is ready to receive requests')
  while (true) {
    logger.debug('Waiting for next invocation')
    await next(extensionId!)
  }
}
main()
