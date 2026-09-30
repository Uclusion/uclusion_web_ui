import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from '@material-ui/core/styles';
import PlanningDialog from './PlanningDialog';
import { defaultTheme } from '../../../config/themes';
import { SearchResultsContext } from '../../../contexts/SearchResultsContext/SearchResultsContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { DiffContext } from '../../../contexts/DiffContext/DiffContext';
import { navigate } from '../../../utils/marketIdPathFunctions';

const mockUpdatePage = jest.fn();
jest.mock('../../../components/PageState/pageStateHooks', () => ({
  usePageStateReducer: () => [{}, jest.fn()],
  getPageReducerPage: () => [{ sectionOpen: 'storiesSection', tabIndex: 0 }, mockUpdatePage],
}));
jest.mock('../../../utils/marketIdPathFunctions', () => ({
  ...jest.requireActual('../../../utils/marketIdPathFunctions'), navigate: jest.fn(),
}));
jest.mock('../../../containers/Screen/Screen', () => ({ children }) => <div>{children}</div>);
jest.mock('../../../containers/CommentBox/CommentBox', () =>
  jest.requireActual('../../../containers/CommentBox/commentOrder'));
jest.mock('../../../components/Notifications/DismissableText', () => () => null);
jest.mock('../../DialogArchives/ArchiveInvestibles', () => () => null);
jest.mock('./MarketTodos', () => () => null);
jest.mock('./DiscussionSection', () => () => null);
jest.mock('./InvestiblesByPerson', () => () => null);
jest.mock('./DialogOutset', () => () => null);
jest.mock('./Backlog', () => ({ __esModule: true, default: () => null, BacklogItem: () => null }));
jest.mock('../../../components/InlineWizard/InlineWizardHost', () => () => null);
jest.mock('react-hotkeys-hook', () => ({ useHotkeys: () => {} }));

const stages = [
  { id: 'started', allows_tasks: true, allows_assignment: true, allows_issues: true,
    assignee_enter_only: true, appears_in_context: true },
  { id: 'backlog', allows_tasks: true, allows_assignment: false, allows_issues: true },
  { id: 'not-doing', allows_tasks: true, allows_assignment: false, close_comments_on_entrance: true },
  { id: 'review', allows_tasks: false, allows_assignment: true },
];
const me = { id: 'me', current_user: true, email: 'me@example.com', investments: [] };

function job(id, stage, createdAt) {
  return {
    investible: { id, name: id, created_at: createdAt },
    market_infos: [{ market_id: 'workspace', group_id: 'view', investible_id: id,
      stage, assigned: ['me'] }],
  };
}

function comment(id, type, updatedAt, extra = {}) {
  return { id, comment_type: type, market_id: 'workspace', group_id: 'view',
    body: id, created_at: updatedAt, updated_at: updatedAt, ...extra };
}

describe('view search match chips', () => {
  let container;
  let root;
  const previousActEnvironment = window.IS_REACT_ACT_ENVIRONMENT;
  const originalScrollIntoView = Element.prototype.scrollIntoView;

  beforeAll(() => {
    window.IS_REACT_ACT_ENVIRONMENT = true;
    Element.prototype.scrollIntoView = jest.fn();
  });
  afterAll(() => {
    window.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
    Element.prototype.scrollIntoView = originalScrollIntoView;
  });
  beforeEach(() => {
    navigate.mockClear();
    mockUpdatePage.mockClear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function renderView({ jobs = [], comments = [], results, parentResults = [], messages = [] }) {
    const noOp = jest.fn();
    const providers = [
      [SearchResultsContext, [{ search: 'needle', results: results.map((id) => ({ id })), parentResults }, noOp]],
      [CommentsContext, [{ workspace: comments }, noOp]],
      [InvestiblesContext, [Object.fromEntries(jobs.map((item) => [item.investible.id, item])), noOp]],
      [MarketStagesContext, [{ workspace: stages }, noOp]],
      [MarketPresencesContext, [{ workspace: [me] }, noOp]],
      [MarketGroupsContext, [{ workspace: [{ id: 'view', name: 'View' }] }, noOp]],
      [MarketsContext, [{ marketDetails: [{ id: 'workspace' }] }, noOp]],
      [GroupMembersContext, [{ view: [{ id: 'me' }] }, noOp]],
      [NotificationsContext, [{ messages }, noOp]],
      [OperationInProgressContext, [false, noOp]],
      [DiffContext, [{}, noOp]],
    ];
    const view = providers.reduceRight((children, [Context, value]) =>
      <Context.Provider value={value}>{children}</Context.Provider>,
    <PlanningDialog marketId="workspace" groupId="view" myPresence={me}
      marketInvestibles={jobs} marketStages={stages} />);
    act(() => root.render(
      <MemoryRouter initialEntries={['/dialog/workspace?groupId=view']}>
        <ThemeProvider theme={defaultTheme}>
          <IntlProvider locale="en" messages={{ match: 'match' }} onError={() => {}}>
            {view}
          </IntlProvider>
        </ThemeProvider>
      </MemoryRouter>
    ));
  }

  function clickMatch(tabIndex) {
    const tab = container.querySelectorAll('[role="tab"]')[tabIndex];
    const chip = tab.querySelector('.MuiTabItem-tag');
    expect(chip.textContent).toContain('match');
    act(() => chip.click());
  }

  it('opens the first displayed Jobs and Backlog job without switching the view tab', () => {
    const jobs = [job('old-job', 'started', '2026-09-01'), job('new-job', 'started', '2026-09-03'),
      job('old-backlog', 'backlog', '2026-09-01'), job('new-backlog', 'not-doing', '2026-09-04')];
    renderView({ jobs, results: ['old-job', 'old-backlog', 'new-job', 'new-backlog'] });

    clickMatch(0);
    expect(navigate).toHaveBeenLastCalledWith(expect.anything(), '/dialog/workspace/new-job', false, false,
      expect.objectContaining({ searchMatch: expect.any(Object) }));
    clickMatch(1);
    expect(navigate).toHaveBeenLastCalledWith(expect.anything(), '/dialog/workspace/new-backlog', false, false,
      expect.objectContaining({ searchMatch: expect.any(Object) }));
    expect(mockUpdatePage).not.toHaveBeenCalled();
  });

  it('opens the matching child in the first counted bug and discussion root', () => {
    const comments = [
      comment('quiet-bug', 'TODO', '2026-09-04', { notification_type: 'RED' }),
      comment('first-bug', 'TODO', '2026-09-01', { notification_type: 'YELLOW' }),
      comment('bug-reply', 'REPLY', '2026-09-02', { reply_id: 'first-bug', root_comment_id: 'first-bug' }),
      comment('old-question', 'QUESTION', '2026-09-01'),
      comment('first-question', 'QUESTION', '2026-09-03'),
      comment('question-reply', 'REPLY', '2026-09-03',
        { reply_id: 'first-question', root_comment_id: 'first-question' }),
      comment('uncounted-note', 'REPORT', '2026-09-05'),
      comment('uncounted-resolved', 'QUESTION', '2026-09-06', { resolved: true }),
    ];
    renderView({ comments,
      results: ['quiet-bug', 'old-question', 'uncounted-note', 'uncounted-resolved', 'bug-reply', 'question-reply'],
      parentResults: ['first-bug', 'first-question'],
      messages: [{ comment_id: 'first-bug', is_highlighted: true }],
    });

    clickMatch(2);
    expect(navigate).toHaveBeenLastCalledWith(expect.anything(), '/dialog/workspace?groupId=view#cbug-reply',
      false, false, expect.objectContaining({ searchMatch: expect.any(Object) }));
    clickMatch(3);
    expect(navigate).toHaveBeenLastCalledWith(expect.anything(), '/dialog/workspace?groupId=view#cquestion-reply',
      false, false, expect.objectContaining({ searchMatch: expect.any(Object) }));
    expect(mockUpdatePage).not.toHaveBeenCalled();
  });
});
