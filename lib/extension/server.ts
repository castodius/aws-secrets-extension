import Koa from 'koa'
import Router from '@koa/router'

import { getParameter, getParameters } from './ssm.js';
import { logger } from './logging.js';
import { variables } from './env.js';
import { getSecretValue } from './sm.js';

const router = new Router()

router.use(async (ctx, next) => {
  const tokenHeader = ctx.headers['x-secrets-extension-token']

  if (!tokenHeader) {
    logger.error('Token header missing in request')
    ctx.throw(401, JSON.stringify({ message: 'Missing auth header "X-Secrets-Extension-Token"' }))
  }

  if (tokenHeader !== process.env.AWS_SESSION_TOKEN) {
    logger.error('Token header does not have same value as AWS_SESSION_TOKEN')
    ctx.throw(401, JSON.stringify({ message: 'Supplied auth header has incorrect value' }))
  }

  await next()
})

router.get('/systemsmanager/parameters/:parameterName', getParameter)
router.get('/ssm/parameters/:parameterName', getParameter)
router.get('/systemsmanager/parameters', getParameters)
router.get('/ssm/parameters', getParameters)

router.get('/secretsmanager/secrets/:secretId', getSecretValue)
router.get('/sm/secrets/:secretId', getSecretValue)

const app = new Koa()

app
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(variables.HTTP_PORT)
logger.info(`AWS Secrets Extension server is ready to receive requests on port ${variables.HTTP_PORT}`)
