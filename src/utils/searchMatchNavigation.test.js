import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import { firstSearchCommentMatch } from './searchMatchNavigation';
import { JUSTIFY_TYPE, QUESTION_TYPE, REPLY_TYPE, TODO_TYPE } from '../constants/comments';
import Voting from '../pages/Investible/Decision/Voting';
import { CommentsContext } from '../contexts/CommentsContext/CommentsContext';
import { DiffContext } from '../contexts/DiffContext/DiffContext';
import { InvestiblesContext } from '../contexts/InvestibesContext/InvestiblesContext';
import { MarketsContext } from '../contexts/MarketsContext/MarketsContext';
import { MarketPresencesContext } from '../contexts/MarketPresencesContext/MarketPresencesContext';
import { NotificationsContext } from '../contexts/NotificationsContext/NotificationsContext';
import { OperationInProgressContext } from '../contexts/OperationInProgressContext/OperationInProgressContext';
import { ScrollContext } from '../contexts/ScrollContext';

jest.mock('../components/Comments/Comment', () => ({ LocalCommentsContext: require('react').createContext({}) }));
jest.mock('../components/Comments/Reply', () => () => null);
jest.mock('../components/TextEditors/ReadOnlyQuillEditor', () => () => null);
jest.mock('../components/TextEditors/DiffDisplay', () => () => null);
jest.mock('../components/CardType', () => () => null);
jest.mock('../components/Avatars/GravatarAndName', () => () => null);
jest.mock('../components/Buttons/TooltipIconButton', () => () => null);
jest.mock('../components/Buttons/SpinningIconLabelButton', () => () => null);
jest.mock('../components/AddNewWizards/Approval/ApprovalWizard', () => ({ commonQuick: jest.fn() }));
jest.mock('../components/AddNewWizards/Reply/ReplyStep', () => ({ hasReply: () => false }));
jest.mock('../components/TextEditors/Utilities/CoreUtils', () => ({ editorEmpty: (body) => !body }));

function renderedVotes(state, reasons, hashFragment, isInbox = false) {
  const noOp = () => {};
  const votes = reasons.map((reason) => <Voting key={reason.id} investibleId={reason.investible_id}
    marketPresences={state.marketPresencesState.inline} investmentReasons={[reason]}
    market={state.marketsState.marketDetails[0]} yourPresence={{ id: 'reader' }}
    useCompression={false} isInbox={isInbox} />);
  const contexts = [
    [CommentsContext, [state.commentsState, noOp]], [DiffContext, [{}, noOp]],
    [InvestiblesContext, [state.investiblesState, noOp]], [MarketsContext, [state.marketsState, noOp]],
    [MarketPresencesContext, [state.marketPresencesState, noOp]],
    [NotificationsContext, [state.messagesState, noOp]], [OperationInProgressContext, [false, noOp]],
    [ScrollContext, [hashFragment]],
  ];
  const tree = contexts.reduceRight((children, [Context, value]) =>
    <Context.Provider value={value}>{children}</Context.Provider>, votes);
  const container = document.createElement('div');
  container.innerHTML = ReactDOMServer.renderToStaticMarkup(
    <ThemeProvider theme={createTheme()}><IntlProvider locale="en" messages={{
      commentCloseThreadLabel: 'Collapse', issueReplyLabel: 'Reply',
    }}><MemoryRouter>{tree}</MemoryRouter></IntlProvider></ThemeProvider>);
  return container;
}

const comment = (id, type = QUESTION_TYPE, extra = {}) => ({
  id, market_id: 'workspace', investible_id: 'job', group_id: 'view', comment_type: type,
  created_by: 'author', created_at: '2026-09-01', updated_at: '2026-09-01', ...extra,
});
const snapshot = (comments, matches, parents = []) => ({
  commentsState: { workspace: comments }, marketsState: { marketDetails: [] },
  investiblesState: {}, marketStagesState: {}, marketPresencesState: {}, messagesState: { messages: [] },
  searchResults: { search: 'needle', results: matches.map((id) => ({ id })), parentResults: parents },
});

it('uses section and displayed reply order while skipping contextual parents and stale hits', () => {
  const task = comment('task', TODO_TYPE);
  const laterRoot = comment('later-root');
  const older = comment('older', REPLY_TYPE, { reply_id: task.id, created_at: '2026-08-01' });
  const inProgress = comment('in-progress', REPLY_TYPE, { reply_id: task.id, in_progress: true });
  const child = comment('child', REPLY_TYPE, { reply_id: inProgress.id, root_comment_id: task.id });
  const state = snapshot([task, laterRoot, older, inProgress, child],
    ['missing', laterRoot.id, older.id, child.id], [task.id, inProgress.id]);
  const target = firstSearchCommentMatch([task, laterRoot], state);
  expect(target).toEqual({ url: '/dialog/workspace/job#cchild',
    state: { searchMatch: { marketId: 'workspace', commentId: task.id } } });
  expect(firstSearchCommentMatch([laterRoot, task], state)?.url).toBe('/dialog/workspace/job#clater-root');
  state.searchResults.results = [{ id: 'missing' }];
  expect(firstSearchCommentMatch([task], state)).toBeUndefined();
});

it('opens actual inline hits in option display order and uses reason and reply anchors on the parent page', () => {
  const question = comment('question', QUESTION_TYPE, { inline_market_id: 'inline' });
  const option = (id, stage) => ({ investible: { id, name: id },
    market_infos: [{ market_id: 'inline', stage }] });
  const state = snapshot([question], ['proposed', 'alpha', 'zeta'], [question.id]);
  state.marketsState.marketDetails = [{ id: 'inline', parent_comment_market_id: 'workspace',
    parent_comment_id: question.id }];
  state.marketStagesState.inline = [{ id: 'approvable', allows_investment: true },
    { id: 'proposed', allows_investment: false }];
  state.investiblesState = { alpha: option('alpha', 'approvable'), zeta: option('zeta', 'approvable'),
    proposed: option('proposed', 'proposed') };
  state.marketPresencesState.inline = [{ id: 'human', email: 'human@example.com', investments: [
    { investible_id: 'zeta', quantity: 100, comment_id: 'reason' },
  ] }, { id: 'banned-human', email: 'banned@example.com', market_banned: true, investments: [
    { investible_id: 'alpha', quantity: 100 },
  ] }];
  expect(firstSearchCommentMatch([question], state)?.url).toBe('/dialog/workspace/job#optionzeta');

  const reason = comment('reason', JUSTIFY_TYPE, { market_id: 'inline', investible_id: 'zeta' });
  const reply = comment('reply', REPLY_TYPE, { market_id: 'inline', investible_id: 'zeta',
    reply_id: reason.id, root_comment_id: reason.id });
  state.commentsState.inline = [reason, reply];
  state.searchResults.parentResults = [question.id, 'zeta', reason.id];
  state.searchResults.results = [{ id: reason.id }];
  expect(firstSearchCommentMatch([question], state)).toEqual({
    url: '/dialog/workspace/job#creason',
    state: { searchMatch: { marketId: 'inline', commentId: reason.id } },
  });
  state.searchResults.results = [{ id: reply.id }];
  expect(firstSearchCommentMatch([question], state)).toEqual({
    url: '/dialog/workspace/job#creply',
    state: { searchMatch: { marketId: 'inline', commentId: reason.id } },
  });
  state.searchResults.results = [{ id: 'proposed' }];
  expect(firstSearchCommentMatch([question], state)?.url).toBe('/dialog/workspace/job#optionproposed');

  // One voter can approve several options on the same page. Each actual reason needs its own anchor.
  const otherReason = { ...reason, id: 'other-reason', investible_id: 'alpha' };
  state.commentsState.inline.push(otherReason);
  state.marketPresencesState.inline[0].investments.push({
    investible_id: 'alpha', quantity: 100, comment_id: otherReason.id,
  });
  const votes = renderedVotes(state, [reason, otherReason], `c${otherReason.id}`);
  const matchedVote = votes.querySelector(`#c${otherReason.id}`);
  expect(votes.querySelectorAll('#cvhuman')).toHaveLength(2); // Existing vote links still work.
  expect(votes.querySelectorAll(`#c${reason.id}`)).toHaveLength(1);
  expect(votes.querySelectorAll(`#c${otherReason.id}`)).toHaveLength(1);
  expect(matchedVote.style.backgroundColor).toBe('rgb(251, 246, 216)');
  expect(votes.querySelector(`#c${reason.id}`).style.backgroundColor).toBe('');
  expect(renderedVotes(state, [otherReason]).querySelector(`#c${otherReason.id}`).style.backgroundColor).toBe('');
  expect(renderedVotes(state, [otherReason], undefined, true).querySelector(`#c${otherReason.id}`)).toBeNull();
});
