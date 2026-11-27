import React, { act, useReducer, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createMemoryHistory } from 'history';
import { Router, useLocation } from 'react-router';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@material-ui/core/styles';
import PlanningInvestible from './PlanningInvestible';
import { AccountContext } from '../../../contexts/AccountContext/AccountContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import commentsReducer, { updateComments } from '../../../contexts/CommentsContext/commentsContextReducer';
import { DiffContext } from '../../../contexts/DiffContext/DiffContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { SearchResultsContext } from '../../../contexts/SearchResultsContext/SearchResultsContext';
import { SyncedMessagesContext } from '../../../contexts/SyncedMessagesContext/SyncedMessagesContext';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';
import { ScrollContext } from '../../../contexts/ScrollContext';
import { setUclusionLocalStorageItem } from '../../../components/localStorageUtils';
import { reopenComment } from '../../../api/comments';
import messages from '../../../config/locales/en';

// Retain the real planning tabs, comments reducer, CommentBox, Comment, Options,
// OptionVoting, OptionListItem, DecisionInvestible and Reopen button. Only the API
// boundary and unrelated editors/navigation/voting presentation are replaced.
jest.mock('../../../api/comments', () => ({
  ...jest.requireActual('../../../api/comments'),
  reopenComment: jest.fn(),
}));
jest.mock('quill', () => {
  function Quill() {}
  Quill.import = () => function QuillImport() {};
  Quill.register = () => {};
  return Quill;
});
jest.mock('../../../containers/Screen/Screen', () => ({ children }) => children);
jest.mock('./NotesTab', () => () => null);
jest.mock('./Approvals', () => () => null);
jest.mock('./PlanningInvestibleNav', () => ({
  __esModule: true, default: () => null, useMetaDataStyles: () => ({}),
}));
jest.mock('../InvestibleBodyEdit', () => ({ useInvestibleEditStyles: () => ({}) }));
jest.mock('../../../components/AddNewWizards/WizardStylesContext', () => ({ wizardStyles: () => ({}) }));
jest.mock('../../../components/AddNewWizards/JobComment/AddCommentStep', () => ({ hasJobComment: () => false }));
jest.mock('../../../components/AddNewWizards/DecisionComment/AddCommentStep', () => ({ hasDecisionComment: () => false }));
jest.mock('../../../components/AddNewWizards/Reply/ReplyStep', () => ({ hasReply: () => false }));
jest.mock('../../../components/AddNewWizards/TaskInProgress/TaskInProgressWizard', () => ({ previousInProgress: () => [] }));
jest.mock('../../../components/InlineWizard/InlineWizardHost', () => () => null);
jest.mock('../../../components/CardType', () => ({
  ...jest.requireActual('../../../components/CardType'), __esModule: true, default: () => null,
}));
jest.mock('../../../components/Descriptions/DescriptionOrDiff', () => () => null);
jest.mock('../../../components/Notifications/DismissableText', () => () => null);
jest.mock('../../../components/SpinBlocking/SpinningButton', () => () => null);
jest.mock('../../../components/TextEditors/ReadOnlyQuillEditor', () => ({ value }) =>
  <div dangerouslySetInnerHTML={{ __html: value }} />);
jest.mock('../../../components/TextEditors/DiffDisplay', () => () => null);
jest.mock('../../../components/Comments/CommentEdit', () => () => null);
jest.mock('../../../components/Comments/Reply', () => () => null);
jest.mock('../../../components/TextFields/UseRelativeTime', () => () => null);
jest.mock('../../../components/Avatars/GravatarAndName', () => () => null);
jest.mock('../../../components/Avatars/GravatarGroup', () => () => null);
jest.mock('../../../components/Files/AttachedFilesList', () => () => null);
jest.mock('../../../containers/CommentBox/InlineInitiativeBox', () => () => null);
jest.mock('../../Home/YourWork/InboxExpansionPanel', () => ({ isMyPokableComment: () => false }));
jest.mock('../../Dialog/InvesibleCommentLinker', () => () => null);
jest.mock('../../Dialog/EditMarketButton', () => () => null);
jest.mock('../../Dialog/Decision/OptionMenu', () => () => null);
jest.mock('../Decision/Voting', () => () => null);
jest.mock('./CondensedTodos', () => () => null);
jest.mock('../../../utils/votingUtils', () => ({
  ...jest.requireActual('../../../utils/votingUtils'), useInvestibleVoters: () => [],
}));
jest.mock('react-hotkeys-hook', () => ({ useHotkeys: () => {} }));
jest.mock('@material-ui/core', () => ({
  ...jest.requireActual('@material-ui/core'), useMediaQuery: () => false,
}));

const marketId = 'workspace';
const inlineId = 'inline';
const jobId = 'job';
const jobUrl = `/dialog/${marketId}/${jobId}`;
const noOp = () => {};
const presences = [
  { id: 'ai', name: 'AI', email: '', investments: [] },
  { id: 'human', name: 'Human', email: 'human@example.com', current_user: true, investments: [] },
];
const rootQuestion = {
  id: 'question', comment_type: 'QUESTION', created_by: 'ai', updated_by: 'ai',
  market_id: marketId, investible_id: jobId, group_id: 'view',
  body: '<p>Parent question</p>', is_sent: true, resolved: false, version: 1,
  created_at: '2026-11-27T10:00:00Z', updated_at: '2026-11-27T10:00:00Z',
};
const nestedQuestion = {
  ...rootQuestion, id: 'nested', market_id: inlineId, investible_id: 'option-b',
  body: '<p>Question inside the option</p>', created_at: '2026-11-27T10:00:30Z',
  updated_at: '2026-11-27T10:00:30Z',
};
const reply = (id, parent, author, time) => ({
  ...parent, id, inline_market_id: undefined, comment_type: 'REPLY', created_by: author, updated_by: author,
  root_comment_id: parent.root_comment_id || parent.id, reply_id: parent.id,
  created_at: time, updated_at: time, body: `<p>${id}</p>`, resolved: false,
});
const market = { id: marketId, market_type: 'PLANNING', market_stage: 'Active' };
const job = {
  investible: { id: jobId, name: 'Critical UI fixes', description: 'Job', created_at: rootQuestion.created_at },
  market_infos: [{ market_id: marketId, investible_id: jobId, stage: 'doable', assigned: [] }],
};
const option = (id, name) => ({
  investible: { id, name, description: name, created_at: rootQuestion.created_at },
  market_infos: [{ market_id: inlineId, investible_id: id, stage: 'approvable', assigned: [] }],
});
const a = option('option-a', 'A');
const b = option('option-b', 'B');
const stageState = {
  [marketId]: [{ id: 'doable', allows_tasks: true, allows_assignment: true, assignee_enter_only: true }],
  [inlineId]: [{ id: 'approvable', allows_investment: true, allows_tasks: true, allows_assignment: true },
    { id: 'proposed', allows_investment: false, allows_tasks: true, allows_assignment: true }],
};
let cleanup;
let oldScrollIntoView;
let oldScrollTo;
let oldActEnvironment;

beforeEach(() => {
  oldActEnvironment = window.IS_REACT_ACT_ENVIRONMENT;
  window.IS_REACT_ACT_ENVIRONMENT = true;
  oldScrollIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = jest.fn();
  oldScrollTo = window.scrollTo;
  window.scrollTo = jest.fn();
  reopenComment.mockReset();
});
afterEach(() => {
  cleanup?.();
  cleanup = undefined;
  Element.prototype.scrollIntoView = oldScrollIntoView;
  window.scrollTo = oldScrollTo;
  window.IS_REACT_ACT_ENVIRONMENT = oldActEnvironment;
});

function renderJob(comments, { vote = false, missingParent = false } = {}) {
  cleanup?.();
  setUclusionLocalStorageItem('investible', { [jobId]: {
    sectionOpen: 'assistanceSection', assistanceTabIndex: 1,
    compressionHash: { [rootQuestion.id]: false }, reportsOpenRaw: false,
  } });
  setUclusionLocalStorageItem('options', { [inlineId]: {
    tabIndex: 0, selectedInvestibleIdTabZero: b.investible.id, investibleIdTabZeroWasSet: true,
  } });
  setUclusionLocalStorageItem('commentEdit', {});
  const history = createMemoryHistory({ initialEntries: [jobUrl] });
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  let dispatchComments;
  const inlineMarket = { id: inlineId, market_type: 'DECISION', market_stage: 'Active',
    parent_comment_market_id: marketId, parent_comment_id: missingParent ? 'unavailable-parent' : rootQuestion.id };
  const inlinePresences = presences.map((presence) => presence.id === 'human' && vote ? { ...presence,
    investments: [{ investible_id: b.investible.id, quantity: 5, updated_at: '2026-11-27T10:01:00Z' }],
  } : presence);
  function Page({ commentsState }) {
    const location = useLocation();
    return <PlanningInvestible marketId={marketId} investibleId={jobId} userId="human"
      market={market} marketInvestible={job} marketPresences={presences}
      investibleComments={commentsState[marketId]} hash={location.hash} />;
  }
  function Fixture() {
    const [commentsState, dispatch] = useReducer(commentsReducer, comments);
    const [operation, setOperation] = useState(false);
    dispatchComments = dispatch;
    const providers = [
      [AccountContext, [{ user: { id: 'human' } }, noOp]],
      [CommentsContext, [commentsState, dispatch]],
      [DiffContext, [{}, noOp]],
      [InvestiblesContext, [{ [jobId]: job, [a.investible.id]: a, [b.investible.id]: b }, noOp]],
      [MarketStagesContext, [stageState, noOp]],
      [MarketPresencesContext, [{ [marketId]: presences, [inlineId]: inlinePresences }, noOp]],
      [MarketsContext, [{ marketDetails: [market, inlineMarket] }, noOp,
        { [`MARKET_${marketId}`]: 'local-fixture', [`MARKET_${inlineId}`]: 'local-fixture' }]],
      [MarketGroupsContext, [{}, noOp]],
      [GroupMembersContext, [{}, noOp]],
      [NotificationsContext, [{ messages: [] }, noOp]],
      [SyncedMessagesContext, { syncedMessages: [], stillLoading: false }],
      [OperationInProgressContext, [operation, setOperation]],
      [SearchResultsContext, [{ search: '', results: [], parentResults: [] }, noOp]],
      [ScrollContext, [undefined, undefined, noOp]],
    ];
    return providers.reduceRight((children, [Context, value]) =>
      <Context.Provider value={value}>{children}</Context.Provider>, <Page commentsState={commentsState} />);
  }
  act(() => root.render(<ThemeProvider theme={createTheme()}><IntlProvider locale="en" messages={messages}>
    <Router history={history}><Fixture /></Router>
  </IntlProvider></ThemeProvider>));
  cleanup = () => {
    act(() => root.unmount());
    container.remove();
  };
  return {
    container, history,
    receive: (comment) => act(() => dispatchComments(updateComments(comment.market_id, [comment]))),
  };
}

it('keeps visible Responded assistance for AI self replies but preserves replies to humans (B-all-757)', () => {
  for (const inline of [false, true]) {
    const parent = inline ? nestedQuestion : rootQuestion;
    const humanReply = reply('human-answer', parent, 'human', '2026-11-27T10:01:00Z');
    const comments = inline ? {
      [marketId]: [{ ...rootQuestion, inline_market_id: inlineId }],
      [inlineId]: [nestedQuestion, humanReply],
    } : { [marketId]: [rootQuestion, humanReply], [inlineId]: [] };
    const page = renderJob(comments);
    expect(page.container.querySelector('#Responded').getAttribute('aria-selected')).toBe('true');
    expect(page.container.querySelector('#cquestion')).not.toBeNull();

    page.receive(reply('ai-self-reply', parent, 'ai', '2026-11-27T10:02:00Z'));
    expect(page.container.querySelector('#Responded').getAttribute('aria-selected')).toBe('true');
    expect(page.container.querySelector('#cquestion')).not.toBeNull();

    page.receive(reply('ai-human-followup', humanReply, 'ai', '2026-11-27T10:03:00Z'));
    expect(page.container.querySelector('#cquestion')).toBeNull();
    act(() => page.container.querySelector('#Unresponded').click());
    expect(page.container.querySelector('#cquestion')).not.toBeNull();
  }
});

it('follows an actual nested-question Reopen into its resulting tab and option after success (B-all-758)', async () => {
  const resolved = { ...nestedQuestion, resolved: true, updated_by: 'human', updated_at: '2026-11-27T10:01:00Z' };
  const reopened = { ...resolved, resolved: false, updated_at: '2026-11-27T10:02:00Z', version: 2 };
  const initial = () => ({ [marketId]: [{ ...rootQuestion, inline_market_id: inlineId }], [inlineId]: [resolved] });

  for (const vote of [false, true]) {
    const page = renderJob(initial(), { vote });
    const button = page.container.querySelector('#commentResolveReopenButtonnested');
    expect(button).not.toBeNull();
    expect(button.textContent).toContain('Reopen');
    expect(page.container.querySelector('#Responded').getAttribute('aria-selected')).toBe('true');
    reopenComment.mockResolvedValueOnce(reopened);
    await act(async () => { button.click(); });
    expect(reopenComment).toHaveBeenLastCalledWith(inlineId, nestedQuestion.id);
    expect(page.history.location.pathname).toBe(jobUrl);
    expect(page.history.location.hash).toBe('#cnested');
    expect(page.history.location.state.searchMatch).toEqual({ marketId: inlineId, commentId: nestedQuestion.id });
    expect(page.container.querySelector(vote ? '#Responded' : '#Unresponded').getAttribute('aria-selected')).toBe('true');
    expect(page.container.querySelector('#optionListItemExpansionoption-b').style.visibility).toBe('visible');
    expect(page.container.querySelector('#cnested').textContent).toContain('Question inside the option');
  }

  const failed = renderJob(initial());
  // Consume the deliberately rejected local request at the fixture boundary;
  // the actual Reopen handler receives no successful response callback.
  reopenComment.mockImplementationOnce(() => ({
    then: (onSuccess) => Promise.reject(new Error('Local reopen failure')).then(onSuccess).catch(() => {}),
  }));
  await act(async () => { failed.container.querySelector('#commentResolveReopenButtonnested').click(); });
  expect(failed.history.location.hash).toBe('');
  expect(failed.container.querySelector('#Responded').getAttribute('aria-selected')).toBe('true');
  expect(failed.container.querySelector('#commentResolveReopenButtonnested').textContent).toContain('Reopen');

  const missing = renderJob(initial(), { missingParent: true });
  reopenComment.mockResolvedValueOnce(reopened);
  await act(async () => { missing.container.querySelector('#commentResolveReopenButtonnested').click(); });
  expect(missing.history.location.pathname).toBe(jobUrl);
  expect(missing.history.location.hash).toBe('');
});
