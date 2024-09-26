import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import z from 'zod'

import { Getter, GetterParams, KoaContext, KoaNext } from "./koa.js";
import { logger } from "./logging.js";
import { cache } from "./cache.js";
import { variables } from "./env.js";
import { validate } from "./validation.js";

const client = new SecretsManagerClient({
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
  versionStage: z.string().optional()
})

export const getSecretValue: Getter = async (params: GetterParams) => {
  const { secretId: id, versionId, versionStage } = validate(getSecretValueSchema, params)
  logger.debug(`Retrieving SM Secret ${id}`)

  return cache.getOrRetrieve({
    service: 'sm',
    key: id,
    getter: () => client.send(new GetSecretValueCommand({
      SecretId: id,
      VersionId: versionId,
      VersionStage: versionStage
    }))
      .then((response) => JSON.stringify(response))
  })
}
