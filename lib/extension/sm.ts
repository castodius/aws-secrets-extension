import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { KoaContext, KoaNext } from "./koa.js";
import { logger } from "./logging.js";

const cache: Record<string, string> = {}
const client = new SecretsManagerClient({})

export const getSecretValue = async (ctx: KoaContext, next: KoaNext) => {
  const { secretId: id, versionId, versionStage } = ctx.params
  logger.debug(`Retrieving SM Secret ${id}`)

  if(cache[id]){
    logger.debug(`Returning cached value for ${id}`)
    ctx.body = cache[id]
    await next()
    return
  }

  logger.debug(`Fetch value for ${id} from AWS`)
  const result = await client.send(new GetSecretValueCommand({
    SecretId: id,
    VersionId: versionId,
    VersionStage: versionStage
  }))

  cache[id] = JSON.stringify(result)
  ctx.body = cache[id]
  await next()
}
