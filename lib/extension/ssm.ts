import { GetParameterCommand, GetParametersCommand, GetParametersCommandOutput, SSMClient, } from '@aws-sdk/client-ssm'
import { tap } from 'rambda'
import z from 'zod'

import { logger } from './logging.js'
import { Getter, GetterParams } from './koa.js'
import { cache } from './cache.js'
import { variables } from './env.js'
import { stringBooleanSchema, stringIntegerSchema, validate } from './validation.js'
import { getRegion } from './region.js'
import { BadRequestError } from './errors.js'

const clients: Record<string, SSMClient> = {}
const getClient = (region: string) => clients[region] ??= new SSMClient({
  region,
  requestHandler: {
    requestTimeout: variables.SSM_TIMEOUT,
    httpsAgent: {
      maxSockets: variables.MAX_CONNECTIONS
    }
  }
})

const getParameterSchema = z.object({
  parameterName: z.string(),
  withDecryption: stringBooleanSchema,
  ttl: stringIntegerSchema.min(-1).default(variables.SSM_TTL),
  region: z.string().default(process.env.AWS_REGION!)
})

export const getParameter: Getter = async (params: GetterParams) => {
  const { parameterName: name, withDecryption, ttl, region: regionParameter } = validate(getParameterSchema, params)
  const region = getRegion(name, regionParameter)
  logger.debug(`Retrieving SSM Parameter ${name} using withDecryption set to ${withDecryption}`)

  return cache.getOrRetrieve({
    service: 'ssm',
    key: name,
    ttl,
    getter: () => getClient(region).send(new GetParameterCommand({
      Name: name,
      WithDecryption: withDecryption
    }))
      .then(JSON.stringify)
  })
}

const getParametersSchema = z.object({
  names: z.string().min(1).or(
    z.array(z.string()).min(1)
  ),
  withDecryption: stringBooleanSchema,
  ttl: stringIntegerSchema.min(-1).default(variables.SSM_TTL),
  region: z.string().default(process.env.AWS_REGION!)
})

export const getParameters: Getter = async (params: GetterParams) => {
  const { names, withDecryption, ttl, region } = validate(getParametersSchema, params)

  const values = unpackNames(names)
  logger.debug(`Retrieving SSM Parameters ${values.join(', ')}`)
  values.sort()

  const regions = values.map(value => getRegion(value, region))
  if (new Set(regions).size !== 1) {
    throw new BadRequestError('Values from multiple regions requested. Only one region per request is supported.')
  }

  const key = values.join(',')
  logger.debug(`Cache key "${key}"`)

  return cache.getOrRetrieve({
    service: 'ssm',
    key,
    ttl,
    getter: () => getClient(regions[0]).send(new GetParametersCommand({
      Names: values,
      WithDecryption: withDecryption
    }))
      .then(tap(cacheIndividualValues(key, ttl)))
      .then(JSON.stringify)
  })
}

const unpackNames = (names: z.infer<typeof getParametersSchema>['names']): string[] => {
  if (Array.isArray(names)) {
    return names
  }
  return names.split(',')
}

const cacheIndividualValues = (key: string, ttl: number) => (result: GetParametersCommandOutput) => {
  logger.debug(`Caching individual values of SSM GetParameters request for names ${key}`)
  for (const parameter of result.Parameters!) {
    const arn = parameter.ARN!
    const name = parameter.Name!
    const item = JSON.stringify(parameter)

    cache.add({
      service: 'ssm',
      key: arn,
      item,
      ttl
    })
    cache.add({
      service: 'ssm',
      key: name,
      item,
      ttl
    })
  }
}
