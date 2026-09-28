import reducer, {
  revertPendingStageGuesses,
  versionsUpdateInvestibles
} from '../contexts/InvestibesContext/investiblesContextReducer';
import { changeInvestibleStage, STAGE_GUESS_CONFIRM_MS } from './commentFunctions';

jest.mock('./LocalForageHelper', () => jest.fn());
jest.mock('../contexts/InvestibesContext/InvestiblesContext', () => ({
  INVESTIBLES_CONTEXT_NAMESPACE: 'investibles_context'
}));
jest.mock('../contexts/LeaderContext/LeaderContext', () => ({ leaderContextHack: { isLeader: false } }));

// J-all-487: the page's stage guess stands only until the server answers or 5 seconds pass.
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
