import Koa from 'koa'
import Router from '@koa/router'

import { next, register } from "./extensionsApi.js";
import { getParameter, getParameters } from './ssm.js';

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
  console.log('register');
  const extensionId = await register();
  console.log('extensionId', extensionId);

  while (true) {
    await next(extensionId!)
  }
}
main()
