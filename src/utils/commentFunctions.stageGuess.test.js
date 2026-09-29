import reducer, {
  revertPendingStageGuesses,
  versionsUpdateInvestibles
} from '../contexts/InvestibesContext/investiblesContextReducer';
import { QUESTION_TYPE, TODO_TYPE } from '../constants/comments';
import { changeInvestibleStage, changeInvestibleStageOnCommentOpen, STAGE_GUESS_CONFIRM_MS } from './commentFunctions';

jest.mock('./LocalForageHelper', () => jest.fn());
jest.mock('../contexts/InvestibesContext/InvestiblesContext', () => ({
  INVESTIBLES_CONTEXT_NAMESPACE: 'investibles_context'
}));
jest.mock('../contexts/LeaderContext/LeaderContext', () => ({ leaderContextHack: { isLeader: false } }));

// J-all-487: a timed stage guess stands only until the server answers or 15 seconds pass.
// A task opened on Reviewable keeps the stage the page showed.
describe('stage guess confirm or revert', () => {
  const approvable = { id: 'approvable', name: 'Approvable' };
  const doable = { id: 'doable', name: 'Doable' };
  let state;

  function dispatch(action) {
    state = reducer(state, action);
  }

  function serverCopy(stage, version) {
    return {
      investible: { id: 'job-1', version: 1 },
      market_infos: [{ id: 'info-1', market_id: 'market-1', stage, assigned: ['user-1'], version }]
    };
  }

  function currentInfo() {
    return state['job-1'].market_infos[0];
  }

  function guess(stage) {
    const { investible, market_infos: marketInfos } = state['job-1'];
    changeInvestibleStage(stage, ['user-1'], '2026-09-28T05:00:00Z', marketInfos[0], marketInfos, investible,
      dispatch);
  }

  beforeEach(() => {
    jest.useFakeTimers();
    state = { 'job-1': serverCopy('requires-input', 1) };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps a guess the server confirms', () => {
    guess(approvable);
    dispatch(versionsUpdateInvestibles([serverCopy('approvable', 2)]));
    jest.advanceTimersByTime(STAGE_GUESS_CONFIRM_MS);

    expect(currentInfo()).toEqual(serverCopy('approvable', 2).market_infos[0]);
  });

  it('puts back a guess the server never answers once the timer ends', () => {
    guess(approvable);
    jest.advanceTimersByTime(STAGE_GUESS_CONFIRM_MS - 1);
    expect(currentInfo().stage).toBe('approvable');

    jest.advanceTimersByTime(1);
    expect(currentInfo()).toEqual(serverCopy('requires-input', 1).market_infos[0]);
  });

  it('keeps a server update with a different stage instead of reverting to the old one', () => {
    guess(approvable);
    dispatch(versionsUpdateInvestibles([serverCopy('doable', 2)]));
    jest.advanceTimersByTime(STAGE_GUESS_CONFIRM_MS);

    expect(currentInfo()).toEqual(serverCopy('doable', 2).market_infos[0]);
  });

  it('puts back the server stage, not an earlier guess, when two guesses go unanswered', () => {
    guess(approvable);
    jest.advanceTimersByTime(2000);
    guess(doable);
    jest.advanceTimersByTime(STAGE_GUESS_CONFIRM_MS - 2000);
    expect(currentInfo().stage).toBe('doable');

    jest.advanceTimersByTime(2000);
    expect(currentInfo()).toEqual(serverCopy('requires-input', 1).market_infos[0]);
  });

  it('checks guesses found pending after a reload, at once or at their deadline', () => {
    const before = serverCopy('requires-input', 1).market_infos[0];
    const pendingInfo = (id, deadline) => ({ ...before, id, stage: 'approvable',
      stage_guess: { before: { ...before, id }, deadline } });
    state = {
      'job-1': { investible: { id: 'job-1', version: 1 }, market_infos: [pendingInfo('info-1', Date.now() - 1)] },
      'job-2': { investible: { id: 'job-2', version: 1 }, market_infos: [pendingInfo('info-2', Date.now() + 3000)] }
    };

    revertPendingStageGuesses(state, dispatch);
    jest.advanceTimersByTime(0);
    expect(state['job-1'].market_infos[0].stage).toBe('requires-input');
    expect(state['job-2'].market_infos[0].stage).toBe('approvable');

    jest.advanceTimersByTime(3000);
    expect(state['job-2'].market_infos[0].stage).toBe('requires-input');
  });
});

describe('a task opened on Reviewable', () => {
  const stages = {
    'market-1': [
      { id: 'approvable', name: 'Approvable', allows_investment: true, allows_tasks: true },
      { id: 'doable', name: 'Doable', assignee_enter_only: true, allows_tasks: true },
      { id: 'reviewable', name: 'Reviewable', allows_tasks: false },
      { id: 'requires-input', name: 'Requires Input', move_on_comment: true, allows_issues: false }
    ]
  };
  let state;

  function dispatch(action) {
    state = reducer(state, action);
  }

  function openComment(commentType, presenceId) {
    const info = { id: 'info-1', market_id: 'market-1', stage: 'reviewable', assigned: ['user-1'], version: 1 };
    const investible = { id: 'job-1', version: 1 };
    state = { 'job-1': { investible, market_infos: [info] } };
    changeInvestibleStageOnCommentOpen(false, false, stages, [info], investible, dispatch, {
      id: 'comment-1', comment_type: commentType, market_id: 'market-1', updated_at: '2026-09-29T16:00:00Z'
    }, { id: presenceId });
  }

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps Doable when an assigned person adds or moves a task', () => {
    openComment(TODO_TYPE, 'user-1');
    expect(state['job-1'].market_infos[0].stage).toBe('doable');
    expect(state['job-1'].market_infos[0].stage_guess).toBeUndefined();

    revertPendingStageGuesses(state, dispatch);
    jest.advanceTimersByTime(STAGE_GUESS_CONFIRM_MS);
    expect(state['job-1'].market_infos[0].stage).toBe('doable');
  });

  it('keeps Approvable when someone who is not assigned adds or moves a task', () => {
    openComment(TODO_TYPE, 'user-2');
    expect(state['job-1'].market_infos[0].stage).toBe('approvable');
    expect(state['job-1'].market_infos[0].stage_guess).toBeUndefined();

    jest.advanceTimersByTime(STAGE_GUESS_CONFIRM_MS);
    expect(state['job-1'].market_infos[0].stage).toBe('approvable');
  });

  it('still reverts a question that moves the job', () => {
    const info = { id: 'info-1', market_id: 'market-1', stage: 'doable', assigned: ['user-1'], version: 1 };
    const investible = { id: 'job-1', version: 1 };
    state = { 'job-1': { investible, market_infos: [info] } };
    changeInvestibleStageOnCommentOpen(false, true, stages, [info], investible, dispatch, {
      id: 'question-1', comment_type: QUESTION_TYPE, market_id: 'market-1', updated_at: '2026-09-29T16:00:00Z'
    }, { id: 'user-1' });

    expect(state['job-1'].market_infos[0].stage).toBe('requires-input');
    expect(state['job-1'].market_infos[0].stage_guess).toBeDefined();
    jest.advanceTimersByTime(STAGE_GUESS_CONFIRM_MS);
    expect(state['job-1'].market_infos[0].stage).toBe('doable');
  });
});
