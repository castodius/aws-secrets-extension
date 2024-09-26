import { GetParameterCommand, GetParametersCommand, GetParametersCommandOutput, SSMClient, } from '@aws-sdk/client-ssm'
import { tap } from 'rambda'
import z from 'zod'

import { logger } from './logging.js'
import { Getter, GetterParams, KoaContext, KoaNext } from './koa.js'
import { cache } from './cache.js'
import { variables } from './env.js'
import { stringBooleanSchema, validate } from './validation.js'

const client = new SSMClient({
  requestHandler: {
    requestTimeout: variables.SSM_TIMEOUT,
    httpsAgent: {
      maxSockets: variables.MAX_CONNECTIONS
    }
  }
})

const getParameterSchema = z.object({
  parameterName: z.string(),
  withDecryption: stringBooleanSchema
})

export const getParameter: Getter = async (params: GetterParams) => {
  const { parameterName, withDecryption} = validate(getParameterSchema, params)
  // safe casting, parameterName is a path parameter
  const name = parameterName as string
  logger.debug(`Retrieving SSM Parameter ${name} using withDecryption set to ${withDecryption}`)

  return cache.getOrRetrieve({
    service: 'ssm',
    key: name,
    getter: () => client.send(new GetParameterCommand({
      Name: name,
      WithDecryption: withDecryption
    }))
      .then(JSON.stringify)
  })
}

export const getParameters: Getter = async (params: GetterParams) => {
  const { names, withDecryption = 'false' } = params

  const values = unpackNames(names)
  logger.debug(`Retrieving SSM Parameters ${values.join(', ')}`)
  values.sort()

  const key = values.join(',')
  logger.debug(`Cache key "${key}"`)

  return cache.getOrRetrieve({
    service: 'ssm',
    key,
    getter: () => client.send(new GetParametersCommand({
      Names: values,
      WithDecryption: withDecryption === 'true'
    }))
      .then(tap(cacheIndividualValues(key)))
      .then(JSON.stringify)
  })
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

const cacheIndividualValues = (key: string) => (result: GetParametersCommandOutput) => {
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
