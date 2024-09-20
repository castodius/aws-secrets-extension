import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";

import { KoaContext, KoaNext } from "./koa.js";
import { logger } from "./logging.js";
import { cache } from "./cache.js";

const client = new SecretsManagerClient({})

export const getSecretValue = async (ctx: KoaContext, next: KoaNext) => {
  const { secretId: id, versionId, versionStage } = ctx.params
  logger.debug(`Retrieving SM Secret ${id}`)

  const item = await cache.getOrRetrieve({
    service: 'sm',
    key: id,
    getter: () => client.send(new GetSecretValueCommand({
      SecretId: id,
      VersionId: versionId,
      VersionStage: versionStage
    }))
      .then((response) => JSON.stringify(response))
  })

  ctx.body = item
  await next()
}
