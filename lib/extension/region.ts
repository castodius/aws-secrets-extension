export const getRegion = (id: string, region?: string): string => {
  const arnRegion = id.match(/^arn:aws:[a-z]+:([a-z0-9-]+):/)
  if (!arnRegion) {
    return region ?? process.env.AWS_REGION!
  }
  
  return arnRegion[1]
}
