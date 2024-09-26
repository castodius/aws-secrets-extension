import Koa from 'koa'
import Router from '@koa/router'
import { HttpError } from './errors.js'

export type KoaContext = Koa.ParameterizedContext<Koa.DefaultState, Koa.DefaultContext & Router.RouterParamContext<Koa.DefaultState, Koa.DefaultContext>, unknown>
export type KoaNext = Koa.Next
export type GetterParams = {
  [key: string]: string[] | string | undefined
}
export type Getter = (params: GetterParams) => Promise<string>

export const wrapGetter = (getter: Getter) => async (ctx: KoaContext, next: KoaNext) => {
  return getter({
    ...ctx.query,
    ...ctx.params
  })
    .then((response) => {
      ctx.body = response
    })
    .catch((err: unknown) => {
      if (err instanceof HttpError) {
        ctx.body = err.message
        ctx.status = err.status
      } else {
        ctx.body = 'Something went wrong'
        ctx.status = 418
      }
    })
    .finally(next)
}
