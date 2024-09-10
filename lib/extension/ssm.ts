import Koa from 'koa'
import Router from '@koa/router'
import { GetParameterCommand, SSMClient, } from '@aws-sdk/client-ssm'

type KoaContext = Koa.ParameterizedContext<Koa.DefaultState, Koa.DefaultContext & Router.RouterParamContext<Koa.DefaultState, Koa.DefaultContext>, unknown>

const cache: Record<string, string> = {}
const client = new SSMClient({})

export const getParameter = async (ctx: KoaContext, next: Koa.Next) => {
  const { parameterName: name } = ctx.params
  const { withDecryption = 'false' } = ctx.query
  console.log(`Getting ${name}`)

  if (cache[name]) {
    console.log(`Found cached value for ${name}`)
    ctx.body = cache[name]
    await next()
    return
  }
  
  const { Parameter } = await client.send(new GetParameterCommand({
    Name: name,
    WithDecryption: withDecryption === 'true'
  }))

  cache[name] = JSON.stringify(Parameter)
  ctx.body = cache[name]
  await next()
}
