import Koa from 'koa'
import Router from '@koa/router'

import { next, register } from "./extensionsApi.js";
import { getParameter, getParameters } from './ssm.js';

const app = new Koa()
const router = new Router()

router.get('/parameters/:parameterName', getParameter)
router.get('/parameters', getParameters)
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
