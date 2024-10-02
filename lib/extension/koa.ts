import Koa from 'koa'
import Router from '@koa/router'

import { HttpError } from './errors.js'
import { CachedItem } from './cache.js'
import { logger } from './logging.js'

export type KoaContext = Koa.ParameterizedContext<Koa.DefaultState, Koa.DefaultContext & Router.RouterParamContext<Koa.DefaultState, Koa.DefaultContext>, unknown>
export type KoaNext = Koa.Next
export type GetterParams = {
  [key: string]: string[] | string | undefined
}
export type Getter = (params: GetterParams) => Promise<CachedItem>

export const wrapGetter = (getter: Getter) => async (ctx: KoaContext, next: KoaNext) => {
  return getter({
    ...ctx.query,
    ...ctx.params,
  })
    .then((response) => {
      ctx.body = response.item as string
      ctx.set('X-Secrets-Extension-Is-Cached', response.cached.toString())
      if (response.cached) {
        ctx.set('X-Secrets-Extension-Cached-At', response.addedAt.toString())
        ctx.set('X-Secrets-Extension-Expires-At', response.expiresAt.toString())
        ctx.set('X-Secrets-Extension-Cache-Key', response.key)
      }
    })
    .catch((err: unknown) => {
      if (err instanceof HttpError) {
        ctx.body = err.message
        ctx.status = err.status
      } else {
        logger.error(JSON.stringify(err))
        ctx.body = 'Something went wrong'
        ctx.status = 418
      }
    })
    .finally(next)
}
