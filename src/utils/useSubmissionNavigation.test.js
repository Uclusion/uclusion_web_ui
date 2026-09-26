import { getSubmissionNavigation } from './useSubmissionNavigation';
import { ISSUE_TYPE, QUESTION_TYPE, REPLY_TYPE, SUGGEST_CHANGE_TYPE } from '../constants/comments';

const time = (hour) => `2026-09-26T${hour}:00:00Z`;
const question = (id, hour, extra = {}) => ({
  id, market_id: 'workspace', investible_id: 'job', group_id: 'view',
  comment_type: QUESTION_TYPE, created_by: 'ai', created_at: time(hour), updated_at: time('10'),
  version: 1, ...extra,
});
const reply = (root, extra = {}) => ({
  id: 'reply', market_id: root.market_id, investible_id: root.investible_id,
  reply_id: root.id, root_comment_id: root.id, comment_type: REPLY_TYPE,
  created_by: 'human', created_at: time('11'), updated_at: time('11'), version: 1, ...extra,
});
function snapshot(roots, inlineMarket) {
  const presences = [{ id: 'ai' }, { id: 'human', email: 'human@example.com', current_user: true }];
  return {
    commentsState: { workspace: roots },
    marketPresencesState: { workspace: presences, inline: presences },
    marketsState: { marketDetails: inlineMarket ? [{ id: 'inline', parent_comment_market_id: 'workspace',
      parent_comment_id: inlineMarket.id }] : [] },
    searchResults: { search: '', results: [], parentResults: [] },
  };
}

describe('navigation after responding to assistance', () => {
  it('opens the following visible unanswered thread after a reply, using the displayed order', () => {
    const first = question('first', '07');
    const current = question('current', '08');
    const filteredOut = question('filtered', '09');
    const next = question('next', '09', { comment_type: ISSUE_TYPE });
    const state = snapshot([next, current, filteredOut, first]);
    state.searchResults = { search: 'matching', results: [first, current, next], parentResults: [] };

    expect(getSubmissionNavigation(state, state, reply(current))?.nextLink).toBe('/dialog/workspace/job#cnext');
  });

  it('wraps after a submitted inline option comment answers the last question', () => {
    const first = question('first', '07', { comment_type: SUGGEST_CHANGE_TYPE });
    const current = question('current', '08', { inline_market_id: 'inline' });
    const state = snapshot([current, first], current);
    const optionComment = { ...reply(current), id: 'option-comment', market_id: 'inline',
      investible_id: 'option', reply_id: undefined, root_comment_id: undefined };

    expect(getSubmissionNavigation(state, state, optionComment)?.nextLink).toBe('/dialog/workspace/job#cfirst');
  });

  it('projects a successful option vote before the presence context has rendered it', () => {
    const current = question('current', '07', { inline_market_id: 'inline' });
    const next = question('next', '08');
    const state = snapshot([next, current], current);
    const result = { commentResult: { commentAction: 'NOOP', comment: {} }, investmentResult: {
      market_id: 'inline', investible_id: 'option', user_id: 'human', quantity: 100, updated_at: time('11'),
    } };

    expect(getSubmissionNavigation(state, state, result)?.nextLink).toBe('/dialog/workspace/job#cnext');
    const alreadyResponded = { ...state, marketPresencesState: { ...state.marketPresencesState,
      inline: [{ id: 'ai' }, { id: 'human', email: 'human@example.com', investments: [result.investmentResult] }] } };
    expect(getSubmissionNavigation(alreadyResponded, alreadyResponded, result)).toBeUndefined();
  });

  it('follows the last answered thread while leaving a newer AI update or absent submission alone', () => {
    const current = question('current', '07');
    const state = snapshot([current]);
    expect(getSubmissionNavigation(state, state, reply(current))).toEqual({
      nextLink: undefined, respondedLink: '/dialog/workspace/job#ccurrent',
    });

    const newerState = { ...state, commentsState: { workspace: [
      { ...current, updated_at: time('12'), version: 2 }, question('next', '08'),
    ] } };
    expect(getSubmissionNavigation(state, newerState, reply(current))).toBeUndefined();
    expect(getSubmissionNavigation(state, newerState, undefined)).toBeUndefined();
  });
});
