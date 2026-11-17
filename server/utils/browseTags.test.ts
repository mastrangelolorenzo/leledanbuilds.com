import { describe, it, expect } from 'vitest'
import { parseTags, serializeTags, matchesAnyTag, toTagList } from './browseTags'

describe('parseTags', () => {
  it('reads a JSON array', () => {
    expect(parseTags('["Organic","Terrain"]')).toEqual(['Organic', 'Terrain'])
  })

  it('reads a row written before migration 0023 as a single tag', () => {
    expect(parseTags('Organic')).toEqual(['Organic'])
  })

  it('treats an empty column as no tags', () => {
    expect(parseTags('')).toEqual([])
    expect(parseTags('[]')).toEqual([])
    expect(parseTags(null)).toEqual([])
  })

  it('drops non-strings and empty strings inside the array', () => {
    expect(parseTags('["Organic",null,"",7,"Terrain"]')).toEqual(['Organic', 'Terrain'])
  })

  it('round-trips through serializeTags', () => {
    expect(parseTags(serializeTags(['A', 'B']))).toEqual(['A', 'B'])
  })
})

describe('matchesAnyTag', () => {
  it('matches when one tag is wanted', () => {
    expect(matchesAnyTag(['Organic', 'Terrain'], ['Terrain'])).toBe(true)
  })

  it('does not match when none is', () => {
    expect(matchesAnyTag(['Organic'], ['Terrain', 'Interior'])).toBe(false)
  })

  it('does not match an item with no tags', () => {
    expect(matchesAnyTag([], ['Terrain'])).toBe(false)
  })
})

describe('toTagList', () => {
  it('accepts an array', () => {
    expect(toTagList(['Organic', 'Terrain'])).toEqual(['Organic', 'Terrain'])
  })

  it('accepts a single string from an older form', () => {
    expect(toTagList('Organic')).toEqual(['Organic'])
  })

  it('trims and drops blanks and non-strings', () => {
    expect(toTagList([' Organic ', '', '   ', 3, null, 'Terrain'])).toEqual(['Organic', 'Terrain'])
  })

  it('returns nothing for a missing field', () => {
    expect(toTagList(undefined)).toEqual([])
    expect(toTagList(null)).toEqual([])
  })
})
