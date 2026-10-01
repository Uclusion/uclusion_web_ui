import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { createMemoryHistory } from 'history';
import { Router, useLocation } from 'react-router';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@material-ui/core/styles';
import PlanningInvestible from './PlanningInvestible';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
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
import { setUclusionLocalStorageItem } from '../../../components/localStorageUtils';
import messages from '../../../config/locales/en';

jest.mock('../../../containers/Screen/Screen', () => ({ children }) => children);
jest.mock('../../../containers/CommentBox/CommentBox', () => ({
  ...jest.requireActual('../../../containers/CommentBox/CommentBox'),
  __esModule: true,
  default: ({ comments }) => <div>{(comments || []).map((comment) => comment.id).join(' ')}</div>,
}));
jest.mock('../../../components/Comments/Comment', () => () => null);
jest.mock('../../../components/Comments/BugListItem', () => ({ expansionOpen, expansionPanel }) =>
  expansionOpen ? expansionPanel : null);
jest.mock('../../../components/Comments/Options', () => ({ getNewBugNotifications: () => [] }));
jest.mock('../../Dialog/Planning/MarketTodos', () => ({ todoClasses: () => ({}) }));
jest.mock('./NotesTab', () => ({ capsules = [], notes = [] }) =>
  <div>{capsules.concat(notes).map((comment) => comment.id).join(' ')}</div>);
jest.mock('./Approvals', () => () => null);
jest.mock('./PlanningInvestibleNav', () => ({
  __esModule: true,
  default: () => null,
  useMetaDataStyles: () => ({}),
}));
jest.mock('../InvestibleBodyEdit', () => ({ useInvestibleEditStyles: () => ({}) }));
jest.mock('../../../components/AddNewWizards/WizardStylesContext', () => ({ wizardStyles: () => ({}) }));
jest.mock('../../../components/AddNewWizards/JobComment/AddCommentStep', () => ({ hasJobComment: () => false }));
jest.mock('../../../components/InlineWizard/InlineWizardHost', () => () => null);
jest.mock('../../../components/CardType', () => () => null);
jest.mock('../../../components/Descriptions/DescriptionOrDiff', () => () => null);
jest.mock('../../../components/Notifications/DismissableText', () => () => null);
jest.mock('../../../components/SpinBlocking/SpinningButton', () => () => null);
jest.mock('../../Dialog/EditMarketButton', () => () => null);
jest.mock('../../../utils/votingUtils', () => ({ useInvestibleVoters: () => [] }));
jest.mock('react-hotkeys-hook', () => ({ useHotkeys: () => {} }));
jest.mock('@material-ui/core', () => ({
  ...jest.requireActual('@material-ui/core'),
  useMediaQuery: () => false,
}));

const marketId = 'workspace';
const jobId = 'job';
const jobUrl = `/dialog/${marketId}/${jobId}`;
const marketInvestible = {
  investible: { id: jobId, name: 'Searchable job', description: 'Description', created_at: '2026-09-01' },
  market_infos: [{ market_id: marketId, investible_id: jobId, stage: 'active', assigned: [] }],
};
const rootComment = (id, commentType, updatedAt, extra = {}) => ({
  id, comment_type: commentType, investible_id: jobId, market_id: marketId,
  body: id, created_at: updatedAt, updated_at: updatedAt, ...extra,
});
const task = rootComment('task', 'TODO', '2026-09-20');
const laterTask = rootComment('later-task', 'TODO', '2026-09-10');
const question = rootComment('question', 'QUESTION', '2026-09-01', { inline_market_id: 'inline' });
const laterQuestion = rootComment('later-question', 'QUESTION', '2026-09-02');
const note = rootComment('note', 'REPORT', '2026-09-20', { notification_type: 'BLUE' });
const laterNote = rootComment('later-note', 'REPORT', '2026-09-10', { notification_type: 'BLUE' });
const reply = (parent) => rootComment(`${parent.id}-reply`, 'REPLY', `${parent.updated_at}T01:00:00Z`, {
  reply_id: parent.id, root_comment_id: parent.id,
});
const comments = [laterNote, laterQuestion, laterTask, note, question, task,
  reply(laterNote), reply(laterQuestion), reply(laterTask), reply(note), reply(question), reply(task)];
const searchResults = {
  search: 'needle',
  // Relevance and source order deliberately disagree with the visible tabs and root order.
  results: [laterNote, laterQuestion, laterTask, note, question, task].map((parent) => ({ id: `${parent.id}-reply` })),
  parentResults: [jobId, ...comments.filter((comment) => !comment.reply_id).map((comment) => comment.id)],
};

let cleanupPage;
function renderPage(initialHash = '', search = searchResults, pageComments = comments,
  sectionOpen = 'notesSection') {
  cleanupPage?.();
  setUclusionLocalStorageItem('investible', { [jobId]: { sectionOpen, reportsOpenRaw: true } });
  const history = createMemoryHistory({ initialEntries: [`${jobUrl}${initialHash}`] });
  const locations = [];
  const unlisten = history.listen((location) => locations.push(location));
  const notificationsDispatch = jest.fn();
  const unread = [{ type: 'UNREAD_REPLY', type_object_id: 'UNREAD_REPLY_task-reply',
    comment_id: 'task-reply', investible_id: jobId, market_id: marketId, is_highlighted: true }];
  const noOp = () => {};
  const providers = [
    [MarketsContext, [{ marketDetails: [{ id: marketId }] }, noOp]],
    [MarketGroupsContext, [{}, noOp]],
    [GroupMembersContext, [{}, noOp]],
    [CommentsContext, [{ [marketId]: pageComments }, noOp]],
    [InvestiblesContext, [{
      [jobId]: marketInvestible,
      option: { investible: { id: 'option' }, market_infos: [{ market_id: 'inline' }] },
    }, noOp]],
    [MarketStagesContext, [{ [marketId]: [{ id: 'active', allows_tasks: true, allows_assignment: true }] }, noOp]],
    [MarketPresencesContext, [{}, noOp]],
    [NotificationsContext, [{ messages: unread }, notificationsDispatch]],
    [SyncedMessagesContext, { syncedMessages: unread, stillLoading: false }],
    [OperationInProgressContext, [false, noOp]],
    [SearchResultsContext, [search, noOp]],
  ];
  function Page() {
    const location = useLocation();
    return <PlanningInvestible marketId={marketId} investibleId={jobId} userId="human"
      market={{ id: marketId }} marketInvestible={marketInvestible} investibleComments={pageComments}
      hash={location.hash} />;
  }
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  const tree = () => <ThemeProvider theme={createTheme()}><IntlProvider locale="en" messages={messages}>
    <Router history={history}>{providers.reduceRight((children, [Context, value]) =>
      <Context.Provider value={value}>{children}</Context.Provider>, <Page />)}</Router>
  </IntlProvider></ThemeProvider>;
  const rerender = () => act(() => root.render(tree()));
  cleanupPage = () => {
    act(() => root.unmount());
    container.remove();
    unlisten();
  };
  rerender();
  return { container, history, locations, notificationsDispatch, rerender };
}

let originalScrollIntoView;
let previousActEnvironment;
beforeEach(() => {
  previousActEnvironment = window.IS_REACT_ACT_ENVIRONMENT;
  window.IS_REACT_ACT_ENVIRONMENT = true;
  originalScrollIntoView = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = jest.fn();
});
afterEach(() => {
  cleanupPage?.();
  cleanupPage = undefined;
  Element.prototype.scrollIntoView = originalScrollIntoView;
  window.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
});

it('opens the first displayed matching reply once for ordinary job entries during search', () => {
  for (const initialHash of ['', '#investible-header']) {
    const { container, history, locations, notificationsDispatch, rerender } = renderPage(initialHash);
    expect(history.location.hash).toBe('#ctask-reply');
    expect(container.querySelector('#Opentasks').getAttribute('aria-selected')).toBe('true');
    act(() => history.replace(jobUrl, history.location.state));
    act(() => container.querySelector('#Notes').click());
    rerender();
    expect(history.location.hash).toBe('');
    expect(container.querySelector('#Notes').getAttribute('aria-selected')).toBe('true');
    expect(locations.filter((location) => location.hash === '#ctask-reply')).toHaveLength(1);
    expect(notificationsDispatch).not.toHaveBeenCalled();
  }
});

it('preserves explicit reply and option destinations and leaves ordinary entry unchanged outside search', () => {
  for (const [hash, search] of [
    ['#clater-question-reply', searchResults],
    ['#optionoption', searchResults],
    ['', { search: '', results: [], parentResults: [] }],
    ['#investible-header', { search: '', results: [], parentResults: [] }],
  ]) {
    const { history, locations, notificationsDispatch } = renderPage(hash, search);
    expect(history.location.hash).toBe(hash);
    expect(locations).toHaveLength(0);
    expect(notificationsDispatch).not.toHaveBeenCalled();
  }
});

it('opens actual matching descendants from Tasks, Debatable and Notes match chips in displayed order', () => {
  const completed = rootComment('completed', 'TODO', '2026-09-22', { resolved: true });
  const { container, history, notificationsDispatch } = renderPage('#clater-question-reply', {
    ...searchResults, results: searchResults.results.concat({ id: completed.id }),
  }, comments.concat(completed));
  for (const [tab, target] of [['Opentasks', task], ['Debatable', question], ['Notes', note]]) {
    const chip = container.querySelector(`#${tab} .MuiTabItem-tag`);
    expect(chip.textContent).toContain('match');
    act(() => chip.click());
    expect(history.location.hash).toBe(`#c${target.id}-reply`);
    expect(container.querySelector(`#${tab}`).getAttribute('aria-selected')).toBe('true');
  }
  act(() => history.replace(jobUrl, history.location.state));
  act(() => container.querySelector('#Overview').click());
  const condensedChip = container.querySelector('#investibleCondensedTodos .MuiTabItem-tag');
  expect(condensedChip.textContent).toContain('match');
  act(() => condensedChip.click());
  expect(history.location.hash).toBe('#ctask-reply');
  expect(container.querySelector('#Opentasks').getAttribute('aria-selected')).toBe('true');

  act(() => history.replace(jobUrl, history.location.state));
  act(() => container.querySelector('#Overview').click());
  act(() => container.querySelector('#tasksOverview').parentElement.querySelector('button').click());
  expect(container.querySelector('#ccompleted')).toBeNull();
  act(() => container.querySelector('#Overview .MuiTabItem-tag').click());
  expect(history.location.hash).toBe('#ccompleted');
  expect(container.querySelector('#ccompleted')).not.toBeNull();
  expect(notificationsDispatch).not.toHaveBeenCalled();
});

it('drops design notes and progress reports that are not search matches', () => {
  const report = rootComment('status', 'REPORT', '2026-09-21');
  const design = rootComment('design', 'REPORT', '2026-09-21', { notification_type: 'BLUE', pinned: true });
  const pageComments = comments.concat(report, design);
  const hidden = renderPage('', { search: 'needle', results: [], parentResults: [] },
    pageComments, 'descriptionVotingSection');
  expect(hidden.container.textContent).not.toContain('status');
  const hiddenDesign = renderPage('', { search: 'needle', results: [], parentResults: [] },
    pageComments, 'notesSection');
  expect(hiddenDesign.container.textContent).not.toContain('design');

  const shownReport = renderPage('', {
    search: 'needle', results: [{ id: 'status' }], parentResults: [],
  }, pageComments, 'descriptionVotingSection');
  expect(shownReport.container.textContent).toContain('status');

  const shownDesign = renderPage('', {
    search: 'needle', results: [{ id: 'design' }], parentResults: [],
  }, pageComments, 'notesSection');
  expect(shownDesign.container.textContent).toContain('design');
  expect(shownDesign.container.textContent).not.toContain('status');
});
