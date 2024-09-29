import { logger } from "./logging.js"

export const getRegion = (id: string, region: string): string => {
  const arnRegion = id.match(/^arn:aws:[a-z]+:([a-z0-9-]+):/)
  if (arnRegion) {
    if(region){
      logger.warn('ARN and Region are both specified. Ignoring provided region')
    }
    return arnRegion[1]
  }

  return region
}
