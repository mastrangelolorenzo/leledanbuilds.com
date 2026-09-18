import { describe, expect, it } from 'vitest'
import { serializeFeatures, parseFeatures } from './pricingSerialization'

describe('pricing feature serialization', () => {
  it('round-trips a list of feature strings', () => {
    const features = ['High Quality', 'Fast Delivery']
    expect(parseFeatures(serializeFeatures(features))).toEqual(features)
  })

  it('parses an empty array safely', () => {
    expect(parseFeatures('[]')).toEqual([])
  })

  it('falls back to an empty array for malformed JSON', () => {
    expect(parseFeatures('not json')).toEqual([])
  })
})
