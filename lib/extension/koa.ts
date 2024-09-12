import Koa from 'koa'
import Router from '@koa/router'

export type KoaContext = Koa.ParameterizedContext<Koa.DefaultState, Koa.DefaultContext & Router.RouterParamContext<Koa.DefaultState, Koa.DefaultContext>, unknown>
export type KoaNext = Koa.Next
