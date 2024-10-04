import { describe, it, expect } from 'vitest'

import { getRegion } from '#lib/extension/region.js'

describe('Region helper', () => {
  describe('getRegion', () => {
    it('should return provided region if id is not an ARN', () => {
      const output = getRegion('something', 'eu-west-1')

      expect(output).toEqual('eu-west-1')
    })

    it('should return region from ARN', () => {
      const output = getRegion('arn:aws:ssm:us-east-1:111122223333:parameter/my-param', 'eu-west-1')

      expect(output).toEqual('us-east-1')
    })

    it('should use env variable AWS_REGION as fallback', () => {
      process.env.AWS_REGION = 'eu-central-1'

      const output = getRegion('something')

      expect(output).toEqual('eu-central-1')
    })
  })
})
