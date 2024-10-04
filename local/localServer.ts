import Koa from 'koa'
import Router from '@koa/router'

const router = new Router({
  prefix: '/2020-01-01/extension',
})

router.post('/register', async (ctx, next) => {
  ctx.set('lambda-extension-identifier', 'cool')
  ctx.status = 200
  await next()
})

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
router.get('/event/next', async (ctx, next) => {
  // no response for an hour
  await sleep(3600 * 1000)
  ctx.body = JSON.stringify({})
  ctx.status = 200
  await next()
})

const app = new Koa()
app
  .use(router.routes())
  .use(router.allowedMethods())

app.listen(process.env.SERVER_PORT)
