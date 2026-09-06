import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { IntlProvider } from 'react-intl';
import { Router } from 'react-router';
import { createMemoryHistory } from 'history';
import { createTheme, ThemeProvider } from '@material-ui/core/styles';
import messages from '../../../config/locales/en';
import { stageChangeInvestible } from '../../../api/investibles';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { DiffContext } from '../../../contexts/DiffContext/DiffContext';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import DoneVotingStep from '../../InboxWizards/Stage/DoneVotingStep';
import CloseCommentsStep from './CloseCommentsStep';
import { MarketMetaData } from '../../../pages/Investible/Planning/PlanningInvestibleNav';

const mockButtons = jest.fn(() => null);
const mockCommentBox = jest.fn(() => null);
const mockSelect = jest.fn(() => null);
const theme = createTheme();

// Keep the transition components and their context selectors real; omit their rich content renderers.
jest.mock('../WizardStepButtons', () => (props) => mockButtons(props));
jest.mock('../../InboxWizards/WizardStepButtons', () => (props) => mockButtons(props));
jest.mock('../../../containers/CommentBox/CommentBox', () => (props) => mockCommentBox(props));
jest.mock('../../InboxWizards/JobDescription', () => () => null);
jest.mock('../../../pages/Investible/Decision/Voting', () => () => null);
jest.mock('../../InboxWizards/PokeReminder', () => () => null);
jest.mock('../../../api/investibles', () => ({ stageChangeInvestible: jest.fn() }));
jest.mock('../../../utils/investibleFunctions', () => ({ onInvestibleStageChange: jest.fn() }));
// MarketMetaData shares a file with the full job navigation. Its rich UI is outside this flow.
jest.mock('../../../pages/Investible/Planning/PlanningInvestible', () => ({
  Assignments: () => null,
  rejectInvestible: jest.fn(),
  useCollaborators: () => [],
}));
jest.mock('../../AgilePlan/DaysEstimate', () => ({ DaysEstimate: () => null }));
jest.mock('../../Email/IdentityList', () => () => null);
jest.mock('./StageActionStep', () => () => null);
jest.mock('../../TextEditors/Utilities/CoreUtils', () => ({
  editorEmpty: () => true,
  getQuillStoredState: jest.fn(),
}));
jest.mock('@material-ui/core', () => ({
  ...jest.requireActual('@material-ui/core'),
  Select: (props) => mockSelect(props),
}));

const marketId = 'market';
const investibleId = 'job';
const groupId = 'view';
const currentStage = { id: 'approvable', name: 'Approvable', allows_assignment: true,
  allows_investment: true, allows_tasks: true };
const doableStage = { id: 'doable', name: 'Doable', allows_assignment: true,
  assignee_enter_only: true, allows_tasks: true };
const marketInfo = { market_id: marketId, group_id: groupId, stage: currentStage.id, assigned: ['human'] };
const job = { investible: { id: investibleId }, market_infos: [marketInfo] };
const presences = [{ id: 'ai', email: '' },
  { id: 'human', email: 'human@example.com', current_user: true },
  { id: 'other-human', email: 'other@example.com' }];

function question(id, overrides = {}) {
  return { id, market_id: marketId, investible_id: investibleId, group_id: groupId,
    comment_type: 'QUESTION', created_by: 'ai', creation_stage_id: currentStage.id,
    updated_at: '2026-09-01T10:00:00Z', is_sent: true, resolved: false, ...overrides };
}

const unanswered = question('unanswered');
const responded = question('responded');
const humanReply = question('human-reply', { comment_type: 'REPLY', created_by: 'human',
  root_comment_id: responded.id, reply_id: responded.id, updated_at: '2026-09-01T11:00:00Z' });
const assignedQuestion = question('assigned-question', { created_by: 'human' });
const nonBlockingComments = [
  question('resolved', { resolved: true }),
  question('deleted', { deleted: true }),
  question('draft', { is_sent: false }),
  question('another-job', { investible_id: 'another-job' }),
  question('human-question', { created_by: 'other-human' }),
  question('unknown-author', { created_by: undefined }),
];

function renderStep(Component, comments, props = {}) {
  const history = createMemoryHistory({ initialEntries: ['/job'] });
  const finish = jest.fn();
  const stepMarketInfo = props.marketInfo || marketInfo;
  const providers = [
    [CommentsContext, { [marketId]: comments }],
    [DiffContext, {}],
    [GroupMembersContext, { [groupId]: [{ id: 'ai' }, { id: 'human' }] }],
    [InvestiblesContext, { [investibleId]: { ...job, market_infos: [stepMarketInfo] } }],
    [MarketPresencesContext, { [marketId]: presences }],
    [MarketsContext, { marketDetails: [{ id: marketId }] }],
    [MarketStagesContext, { [marketId]: [currentStage, doableStage] }],
    [NotificationsContext, {}],
    [OperationInProgressContext, false],
  ];
  const step = <Component marketId={marketId} investibleId={investibleId} groupId={groupId}
    marketInfo={stepMarketInfo} formData={{ stage: doableStage.id }} myFinish={finish}
    requiresAction={() => false} isSingleUser {...props} />;
  ReactDOMServer.renderToStaticMarkup(
    <Router history={history}>
      <IntlProvider locale="en" messages={messages}>
        <ThemeProvider theme={theme}>
          {providers.reduceRight((children, [Context, state]) =>
            <Context.Provider value={[state, jest.fn()]}>{children}</Context.Provider>, step)}
        </ThemeProvider>
      </IntlProvider>
    </Router>
  );
  return { history, finish, buttons: mockButtons.mock.calls.at(-1)?.[0] };
}

describe('entering Doable with unresolved AI questions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.scrollTo = jest.fn();
    stageChangeInvestible.mockImplementation(({ stageInfo }) => {
      const movedJob = { ...job, market_infos: [{ ...marketInfo, stage: doableStage.id }] };
      return Promise.resolve(stageInfo.resolve_comment_ids ? {
        full_investible: movedJob,
        comments: stageInfo.resolve_comment_ids.map((id) => question(id, { resolved: true })),
      } : movedJob);
    });
  });

  it('routes the approval action to confirmation even when the remaining AI question has a human response', async () => {
    const { buttons, history } = renderStep(DoneVotingStep, [responded, humanReply]);

    await buttons.onNext();

    expect(stageChangeInvestible).not.toHaveBeenCalled();
    expect(history.location.pathname).toBe('/wizard');
    const destination = new URLSearchParams(history.location.hash.slice(1));
    expect(destination.get('investibleId')).toBe(investibleId);
    expect(destination.get('stageId')).toBe(doableStage.id);
    expect(destination.get('isAssign')).not.toBe('false');
  });

  it('keeps the direct approval action when no live AI question belongs to this job', async () => {
    const { buttons } = renderStep(DoneVotingStep, nonBlockingComments);

    await buttons.onNext();

    expect(stageChangeInvestible).toHaveBeenCalledWith({ marketId, investibleId,
      stageInfo: { current_stage_id: currentStage.id, stage_id: doableStage.id } });
  });

  it('shows and explicitly resolves every remaining AI question together with existing assignee assistance', async () => {
    const { buttons, finish } = renderStep(CloseCommentsStep,
      [unanswered, responded, humanReply, assignedQuestion, ...nonBlockingComments]);

    expect(mockCommentBox.mock.calls.at(-1)?.[0].comments.map(({ id }) => id)).toEqual([
      unanswered.id, responded.id, humanReply.id, assignedQuestion.id,
    ]);
    await buttons.onNext();

    expect(stageChangeInvestible).toHaveBeenCalledWith({ marketId, investibleId,
      stageInfo: { current_stage_id: currentStage.id, stage_id: doableStage.id,
        resolve_comment_ids: [unanswered.id, responded.id, assignedQuestion.id] } });
    expect(finish).toHaveBeenCalledWith(doableStage);
  });

  it('preserves the dropdown mover through confirmation and allows cancellation before committing', async () => {
    const unassignedInfo = { ...marketInfo, assigned: [] };
    const { history } = renderStep(MarketMetaData, [unanswered], {
      marketInfo: unassignedInfo, assigned: [], isAssigned: false, userId: 'human',
      stageId: currentStage.id, stagesInfo: {}, pageState: {}, requiresCloseComments: () => true,
    });
    mockSelect.mock.calls.at(-1)[0].onChange({ target: { value: doableStage.id } });

    expect(stageChangeInvestible).not.toHaveBeenCalled();
    const destination = new URLSearchParams(history.location.hash.slice(1));
    expect(destination.get('assignId')).toBe('human');
    const confirmationProps = { marketInfo: unassignedInfo, assignId: destination.get('assignId') };
    const { buttons, finish } = renderStep(CloseCommentsStep, [unanswered], confirmationProps);

    buttons.onTerminate();

    expect(stageChangeInvestible).not.toHaveBeenCalled();
    expect(finish).toHaveBeenCalledWith(doableStage, true);

    const reopened = renderStep(CloseCommentsStep, [unanswered], confirmationProps);
    await reopened.buttons.onNext();

    expect(stageChangeInvestible).toHaveBeenCalledWith({ marketId, investibleId,
      stageInfo: { current_stage_id: currentStage.id, stage_id: doableStage.id,
        resolve_comment_ids: [unanswered.id], assignments: ['human'] } });
  });
});
