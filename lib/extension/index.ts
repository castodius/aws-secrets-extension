import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import Koa from 'koa'
import Router from '@koa/router'

import { next, register } from "./extensionsApi.js";

const client = new SSMClient({})
const app = new Koa()
const router = new Router()

const cache: any = {}

router.get('/parameters/:parameterName', async (ctx, next) => {
  console.log('hitting endpoint')
  const name = ctx.params.parameterName
  if (cache[name]) {
    ctx.body = cache[name]
    console.log('Fetching cached value')
    await next()
    return
  }

  console.log('Fetching fresh value')
  const response = await client.send(new GetParameterCommand({
    Name: name
  }))

  cache[name] = JSON.stringify(response.Parameter)
  ctx.body = cache[name]
  await next()
})

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
