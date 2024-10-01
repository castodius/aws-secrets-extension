import { GetParameterCommand, GetParametersCommand, GetParametersCommandOutput, SSMClient, } from '@aws-sdk/client-ssm'
import { tap } from 'rambda'
import z from 'zod'

import { logger } from './logging.js'
import { Getter, GetterParams } from './koa.js'
import { Cache, cache } from './cache.js'
import { variables } from './env.js'
import { stringBooleanSchema, validate, getBaseParameters } from './validation.js'
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

const getParameterSchema = getBaseParameters(variables.SSM_TTL).extend({
  parameterName: z.string(),
  withDecryption: stringBooleanSchema,
})

export const getParameter: Getter = async (params: GetterParams) => {
  const { parameterName: name, withDecryption, ttl, region: regionParameter, cacheKey } = validate(getParameterSchema, params)
  const region = getRegion(name, regionParameter)
  const key = cacheKey ?? Cache.createCacheKey({
    name,
    withDecryption,
    region
  })
  logger.debug(`Retrieving SSM Parameter ${name} using withDecryption set to ${withDecryption}`)

  return cache.getOrRetrieve({
    service: 'ssm',
    key,
    ttl,
    getter: () => getClient(region).send(new GetParameterCommand({
      Name: name,
      WithDecryption: withDecryption
    }))
      .then(JSON.stringify)
  })
}

const getParametersSchema = getBaseParameters(variables.SSM_TTL).extend({
  names: z.string().min(1).or(
    z.array(z.string()).min(1)
  ),
  withDecryption: stringBooleanSchema,
})

export const getParameters: Getter = async (params: GetterParams) => {
  const { names: namesParameter, withDecryption, ttl, region: regionParameter, cacheKey } = validate(getParametersSchema, params)
  const names = unpackNames(namesParameter)
  names.sort()

  const regions = names.map(value => getRegion(value, regionParameter))
  if (new Set(regions).size !== 1) {
    throw new BadRequestError('Values from multiple regions requested. Only one region per request is supported.')
  }
  const region = regions[0]

  const key = cacheKey ?? Cache.createCacheKey({
    names,
    withDecryption,
    region
  })
  logger.debug(`Retrieving SSM Parameters ${names.join(', ')}`)

  return cache.getOrRetrieve({
    service: 'ssm',
    key,
    ttl,
    getter: () => getClient(region).send(new GetParametersCommand({
      Names: names,
      WithDecryption: withDecryption
    }))
      .then(tap(cacheIndividualValues(withDecryption, region, ttl)))
      .then(JSON.stringify)
  })
}

const unpackNames = (names: z.infer<typeof getParametersSchema>['names']): string[] => {
  if (Array.isArray(names)) {
    return names
  }
  return names.split(',')
}

const cacheIndividualValues = (withDecryption: boolean, region: string, ttl: number) => (result: GetParametersCommandOutput) => {
  logger.debug('Caching individual values of SSM GetParameters request')
  for (const parameter of result.Parameters!) {
    const arn = parameter.ARN!
    const name = parameter.Name!
    const item = JSON.stringify(parameter)

    cache.add({
      service: 'ssm',
      key: Cache.createCacheKey({
        arn,
        withDecryption,
        region
      }),
      item,
      ttl
    })
    cache.add({
      service: 'ssm',
      key: Cache.createCacheKey({
        name,
        withDecryption,
        region
      }),
      item,
      ttl
    })
  }
}
