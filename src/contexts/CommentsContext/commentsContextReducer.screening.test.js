import { screenOutDoNotPersist } from './commentsContextReducer';

jest.mock('../../utils/LocalForageHelper', () => jest.fn());
jest.mock('./CommentsContext', () => ({ COMMENTS_CONTEXT_NAMESPACE: 'comments_context' }));
jest.mock('../LeaderContext/LeaderContext', () => ({ leaderContextHack: {} }));

describe('screenOutDoNotPersist', () => {
  it('returns the same state when nothing is marked', () => {
    const state = { m1: [{ id: 'c1' }], m2: [{ id: 'c2' }] };
    expect(screenOutDoNotPersist(state)).toBe(state);
  });

  it('filters marked comments out of the stored copy only', () => {
    const state = { m1: [{ id: 'c1' }, { id: 'c2', doNotPersist: true }], m2: [{ id: 'c3' }] };
    const stored = screenOutDoNotPersist(state);
    expect(stored.m1.map((comment) => comment.id)).toEqual(['c1']);
    expect(stored.m2).toEqual(state.m2);
    // The in memory state is untouched - the archived comments stay usable for the session
    expect(state.m1).toHaveLength(2);
  });

  it('ignores non array entries like initializing markers', () => {
    const state = { initializing: true, m1: [{ id: 'c1', doNotPersist: true }] };
    const stored = screenOutDoNotPersist(state);
    expect(stored.initializing).toBe(true);
    expect(stored.m1).toEqual([]);
  });
});
