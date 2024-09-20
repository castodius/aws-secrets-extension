import { logger } from "./logging.js"
import { variables } from "./env.js"

export interface GetParams {
  readonly service: string
  readonly key: string
}

export interface AddParams extends GetParams {
  getter: () => Promise<string>
}


export class Cache {
  #cache: Record<string, Record<string, string>> = {}
  #itemCount: number = 0
  #maxItems: number

  constructor(maxItems: number) {
    this.#maxItems = maxItems
  }

  public async add(params: AddParams): Promise<string> {
    const { service, key } = params
    const item = await params.getter()

    logger.debug(`Successfully retrieved ${key} for ${service} from AWS`)
    if(this.#itemCount < this.#maxItems){
      logger.debug(`Item count is below max items, adding ${key} for ${service}`)
      this.getServiceCache(service)[params.key] = item
      this.#itemCount++
    } else {
      logger.debug(`Item count is at max items. ${key} for ${service} will not be added`)
    }
    return item
  }

  public get(params: GetParams): string | undefined {
    const { service, key } = params
    logger.debug(`Getting ${key} for ${service}`)

    const item = this.getServiceCache(service)[key]
    if (!item) {
      logger.debug(`No item found for ${key} for ${service}`)
    } else {
      logger.debug(`Item found for ${key} for ${service}`)
    }
    return item
  }

  public async getOrAdd(params: AddParams): Promise<string> {
    const cachedItem = this.get(params)
    if (cachedItem) {
      return cachedItem
    }
    return this.add(params)
  }

  public size(): number {
    return this.#itemCount
  }

  private getServiceCache(service: string): Record<string, string> {
    if(!(service in this.#cache)){
      this.#cache[service] = {}
    }
    return this.#cache[service]
  }
}

export const cache = new Cache(variables.CACHE_SIZE)
