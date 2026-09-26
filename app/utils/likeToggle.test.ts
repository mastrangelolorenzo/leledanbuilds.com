import { describe, expect, it } from 'vitest'
import { optimisticLikeToggle } from './likeToggle'

describe('optimisticLikeToggle', () => {
  it('turns an unliked item liked and increments the count', () => {
    expect(optimisticLikeToggle({ liked_by_me: false, like_count: 3 })).toEqual({
      liked_by_me: true,
      like_count: 4,
    })
  })

  it('turns a liked item unliked and decrements the count', () => {
    expect(optimisticLikeToggle({ liked_by_me: true, like_count: 4 })).toEqual({
      liked_by_me: false,
      like_count: 3,
    })
  })

  it('does not mutate the input state', () => {
    const state = { liked_by_me: false, like_count: 0 }
    optimisticLikeToggle(state)
    expect(state).toEqual({ liked_by_me: false, like_count: 0 })
  })

  it('going from unliked with a zero count produces a count of 1', () => {
    expect(optimisticLikeToggle({ liked_by_me: false, like_count: 0 })).toEqual({
      liked_by_me: true,
      like_count: 1,
    })
  })
})
