import { logger } from "./logging.js"
import { variables } from "./env.js"
import { getCurrentEpoch } from "./date.js"

export interface GetParams {
  readonly service: string
  readonly key: string
}

export interface AddParams extends GetParams {
  readonly item: string
  readonly ttl: number
}

export interface RetrieveParams extends GetParams {
  readonly getter: () => Promise<string>
  readonly ttl: number
}

export interface CachedItem {
  readonly key: string
  readonly item: string
  readonly expiresAt: number
  readonly addedAt: number
  readonly cached: boolean
}

export const INFINITE_TTL = -1

export class Cache {
  #cache: Record<string, Record<string, CachedItem>> = {}
  #enabled: boolean
  #itemCount: number = 0
  #maxItems: number

  constructor(maxItems: number, enabled: boolean) {
    this.#maxItems = maxItems
    this.#enabled = enabled
  }

  public add(params: AddParams): CachedItem {
    const { service, key, item, ttl } = params

    const hasSpace = this.#itemCount < this.#maxItems

    if (!this.#enabled || !hasSpace || !ttl) {
      if (!this.#enabled) {
        logger.debug('Cache is disabled')
      } else if (!ttl) {
        logger.debug('TTL is zero, item will not be cached')
      } else {
        logger.debug(`Item count is at max items. ${key} for ${service} will not be added`)
      }
      return {
        key,
        item,
        expiresAt: 0,
        addedAt: 0,
        cached: false
      }
    }

    logger.debug(`Item count is below max items, adding ${key} for ${service}`)
    const epoch = getCurrentEpoch()
    const cachedItem: CachedItem = {
      key,
      item,
      expiresAt: INFINITE_TTL === ttl ? ttl : epoch + ttl,
      addedAt: epoch,
      cached: true
    }
    logger.debug({
      message: 'Item set to expire at',
      expiresAt: cachedItem.expiresAt,
    })

    this.getServiceCache(service)[params.key] = cachedItem
    this.#itemCount++
    return cachedItem
  }

  public get(params: GetParams): CachedItem | undefined {
    const { service, key } = params
    logger.debug(`Getting ${key} for ${service}`)

    const item = this.getServiceCache(service)[key]
    if (!item) {
      logger.debug(`No item found for ${key} for ${service}`)
      return undefined
    }

    logger.debug(`Item found for ${key} for ${service}`)

    if(item.expiresAt === INFINITE_TTL){
      logger.debug('Item has infinite TTL')
      return item
    }

    if (item.expiresAt < getCurrentEpoch()) {
      logger.debug('Item has expired')
      return undefined
    }
    return item
  }

  public async getOrRetrieve(params: RetrieveParams): Promise<CachedItem> {
    const cachedItem = this.get(params)
    if (cachedItem) {
      return cachedItem
    }
    return this.retrieveAndAdd(params)
  }

  public size(): number {
    return this.#itemCount
  }

  private async retrieveAndAdd(params: RetrieveParams): Promise<CachedItem> {
    const { service, key, getter, ttl } = params

    logger.debug(`Retrieving ${key} for ${service} from AWS`)
    return getter()
      .then((item: string) => {
        logger.debug(`Successfully retrieved ${key} for ${service} from AWS`)

        return this.add({
          service,
          key,
          item,
          ttl
        })
      })
  }

  private getServiceCache(service: string): Record<string, CachedItem> {
    if (!(service in this.#cache)) {
      this.#cache[service] = {}
    }
    return this.#cache[service]
  }
}

export const cache = new Cache(variables.CACHE_SIZE, variables.CACHE_ENABLED)
