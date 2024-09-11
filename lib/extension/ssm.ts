import Koa from 'koa'
import Router from '@koa/router'
import { GetParameterCommand, GetParametersCommand, GetParametersCommandOutput, SSMClient, } from '@aws-sdk/client-ssm'
import { logger } from './logging.js'

type KoaContext = Koa.ParameterizedContext<Koa.DefaultState, Koa.DefaultContext & Router.RouterParamContext<Koa.DefaultState, Koa.DefaultContext>, unknown>

const cache: Record<string, string> = {}
const client = new SSMClient({})

export const getParameter = async (ctx: KoaContext, next: Koa.Next) => {
  const { parameterName: name } = ctx.params
  const { withDecryption = 'false' } = ctx.query
  logger.debug(`Retrieving SSM Parameter ${name}`)

  if (cache[name]) {
    logger.debug(`Returning cached value for ${name}`)
    ctx.body = cache[name]
    await next()
    return
  }

  logger.debug(`Fetch value for ${name} from AWS`)
  const result = await client.send(new GetParameterCommand({
    Name: name,
    WithDecryption: withDecryption === 'true'
  }))

  cache[name] = JSON.stringify(result)
  ctx.body = cache[name]
  await next()
}

export const getParameters = async (ctx: KoaContext, next: Koa.Next) => {
  const { names, withDecryption = 'false' } = ctx.query
  
  const values = unpackNames(names)
  logger.debug(`Retrieving SSM Parameters ${values.join(', ')}`)
  values.sort()

  const key = values.join(',')
  logger.debug(`Cache key "${key}"`)
  if (cache[key]) {
    console.log(`Returning cached value for ${key}`)
    ctx.body = cache[key]
    await next()
    return
  }

  logger.debug(`Fetch value for ${key} from AWS`)
  const result = await client.send(new GetParametersCommand({
    Names: values,
    WithDecryption: withDecryption === 'true'
  }))

  cache[key] = JSON.stringify(result)
  ctx.body = cache[key]
  cacheIndividualValues(result)

  await next()
}


const unpackNames = (names: string | string[] | undefined): string[] => {
  if (!names) {
    return []
  }
  if (Array.isArray(names)) {
    return names
  }
  return names.split(',')
}

const cacheIndividualValues = (result: GetParametersCommandOutput) => {
  for (const parameter of result.Parameters!) {
    const arn = parameter.ARN!
    const name = arn.match(/.*:parameter\/(.*)/)![1]

    cache[arn] = JSON.stringify(parameter)
    cache[name] = JSON.stringify(parameter)
  }
}
