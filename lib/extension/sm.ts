import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

import { Getter, GetterParams, KoaContext, KoaNext } from "./koa.js";
import { logger } from "./logging.js";
import { cache } from "./cache.js";
import { variables } from "./env.js";

const client = new SecretsManagerClient({
  requestHandler: {
    requestTimeout: variables.SM_TIMEOUT,
    httpsAgent: {
      maxSockets: variables.MAX_CONNECTIONS
    }
  }
})

export const getSecretValue: Getter = async (params: GetterParams) => {
  const { secretId, versionId, versionStage } = params
  // safe casting, secretId is a path parameter
  const id = secretId as string
  logger.debug(`Retrieving SM Secret ${id}`)

  return cache.getOrRetrieve({
    service: 'sm',
    key: id,
    getter: () => client.send(new GetSecretValueCommand({
      SecretId: id,
      VersionId: versionId as string,
      VersionStage: versionStage as string
    }))
      .then((response) => JSON.stringify(response))
  })
}
