import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import z from 'zod'

import { Getter, GetterParams } from "./koa.js";
import { logger } from "./logging.js";
import { Cache, cache } from "./cache.js";
import { variables } from "./env.js";
import { stringIntegerSchema, validate } from "./validation.js";
import { getRegion } from "./region.js";

const clients: Record<string, SecretsManagerClient> = {}
const getClient = (region: string) => clients[region] ??= new SecretsManagerClient({
  region,
  requestHandler: {
    requestTimeout: variables.SM_TIMEOUT,
    httpsAgent: {
      maxSockets: variables.MAX_CONNECTIONS
    }
  }
})

const getSecretValueSchema = z.object({
  secretId: z.string(),
  versionId: z.string().optional(),
  versionStage: z.string().optional().default('AWSCURRENT'),
  ttl: stringIntegerSchema.min(-1).default(variables.SM_TTL),
  region: z.string().optional()
})

export const getSecretValue: Getter = async (params: GetterParams) => {
  const { secretId, versionId, versionStage, ttl, region: regionParameter } = validate(getSecretValueSchema, params)
  const region = getRegion(secretId, regionParameter)
  const key = Cache.createCacheKey({
    secretId,
    versionId,
    versionStage,
    region
  })
  logger.debug(`Retrieving SM Secret ${secretId}`)

  return cache.getOrRetrieve({
    service: 'sm',
    key,
    ttl,
    getter: () => getClient(region).send(new GetSecretValueCommand({
      SecretId: secretId,
      VersionId: versionId,
      VersionStage: versionStage
    }))
      .then((response) => JSON.stringify(response))
  })
}
