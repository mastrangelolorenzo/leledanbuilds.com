// Pure state-transition for the optimistic like toggle used by
// app/components/LikeButton.vue. Kept framework-free (no Vue refs, no
// fetch) so the transition itself -- not the network plumbing around it --
// can be unit-tested directly, matching this project's split between
// unit-tested pure/util logic and live-HTTP-tested route handlers.
//
// The component calls this once to compute the immediate optimistic
// state right after a click, then reconciles with whatever the server
// actually returns (see server/api/browse-items/[id]/like.post.ts), and
// rolls back to the pre-click snapshot if the request fails.
export interface LikeState {
  liked_by_me: boolean
  like_count: number
}

export function optimisticLikeToggle(state: LikeState): LikeState {
  return {
    liked_by_me: !state.liked_by_me,
    like_count: state.liked_by_me ? state.like_count - 1 : state.like_count + 1,
  }
}
