import { GetParameterCommand, GetParametersCommand, GetParametersCommandOutput, SSMClient, } from '@aws-sdk/client-ssm'

import { logger } from './logging.js'
import { Getter, GetterParams, KoaContext, KoaNext } from './koa.js'
import { cache } from './cache.js'

const client = new SSMClient({})

export const getParameter: Getter = async (params: GetterParams) => {
  const { parameterName, withDecryption = 'false' } = params
  // safe casting, parameterName is a path parameter
  const name = parameterName as string
  logger.debug(`Retrieving SSM Parameter ${name}`)

  return cache.getOrRetrieve({
    service: 'ssm',
    key: name,
    getter: () => client.send(new GetParameterCommand({
      Name: name,
      WithDecryption: withDecryption === 'true'
    }))
      .then((response) => JSON.stringify(response))
  })
}

export const getParameters = async (ctx: KoaContext, next: KoaNext) => {
  const { names, withDecryption = 'false' } = ctx.query

  const values = unpackNames(names)
  logger.debug(`Retrieving SSM Parameters ${values.join(', ')}`)
  values.sort()

  const key = values.join(',')
  logger.debug(`Cache key "${key}"`)

  const item = await cache.getOrRetrieve({
    service: 'ssm',
    key,
    getter: () => client.send(new GetParametersCommand({
      Names: values,
      WithDecryption: withDecryption === 'true'
    }))
      .then((response) => {
        cacheIndividualValues(response, key)
        return response
      })
      .then((response) => JSON.stringify(response))
  })

  ctx.body = item
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

const cacheIndividualValues = (result: GetParametersCommandOutput, key: string) => {
  logger.debug(`Caching individual values of SSM GetParameters request for names ${key}`)
  for (const parameter of result.Parameters!) {
    const arn = parameter.ARN!
    const name = parameter.Name!
    const item = JSON.stringify(parameter)

    cache.add({
      service: 'ssm',
      key: arn,
      item
    })
    cache.add({
      service: 'ssm',
      key: name,
      item
    })
  }
}
