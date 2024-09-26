import { logger } from "./logging.js"
import { variables } from "./env.js"

export interface GetParams {
  readonly service: string
  readonly key: string
}

export interface AddParams extends GetParams {
  readonly item: string
}

export interface RetrieveParams extends GetParams {
  readonly getter: () => Promise<string>
}

export class Cache {
  #cache: Record<string, Record<string, string>> = {}
  #enabled: boolean
  #itemCount: number = 0
  #maxItems: number

  constructor(maxItems: number, enabled: boolean) {
    this.#maxItems = maxItems
    this.#enabled = enabled
  }

  public add(params: AddParams): string {
    const { service, key, item } = params

    if (!this.#enabled) {
      logger.debug('Cache is disabled')
      return item
    }

    if (this.#itemCount < this.#maxItems) {
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

  public async getOrRetrieve(params: RetrieveParams): Promise<string> {
    const cachedItem = this.get(params)
    if (cachedItem) {
      return cachedItem
    }
    return this.retrieveAndAdd(params)
  }

  public size(): number {
    return this.#itemCount
  }

  private async retrieveAndAdd(params: RetrieveParams): Promise<string> {
    const { service, key, getter } = params

    logger.debug(`Retrieving ${key} for ${service} from AWS`)
    return getter()
      .then((item: string) => {
        logger.debug(`Successfully retrieved ${key} for ${service} from AWS`)

        this.add({
          service,
          key,
          item
        })
        return item
      })
  }

  private getServiceCache(service: string): Record<string, string> {
    if (!(service in this.#cache)) {
      this.#cache[service] = {}
    }
    return this.#cache[service]
  }
}

export const cache = new Cache(variables.CACHE_SIZE, variables.CACHE_ENABLED)
