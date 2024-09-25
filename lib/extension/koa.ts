import Koa from 'koa'
import Router from '@koa/router'

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
    .then(next)
}