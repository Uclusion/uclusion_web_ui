import reducer, { versionsUpdateInvestibles } from './investiblesContextReducer';

jest.mock('../../utils/LocalForageHelper', () => jest.fn());
jest.mock('./InvestiblesContext', () => ({ INVESTIBLES_CONTEXT_NAMESPACE: 'investibles_context' }));
jest.mock('../LeaderContext/LeaderContext', () => ({ leaderContextHack: { isLeader: false } }));

function investibleAt(stage, marketInfoVersion) {
  return {
    investible: { id: 'job-1', version: 1 },
    market_infos: [{ id: 'market-info-1', market_id: 'market-1', stage,
      version: marketInfoVersion }]
  };
}

describe('investible context version updates', () => {
  it.each([
    ['Doable to Requires Input, old first', 'Doable', 'Requires Input', false],
    ['Doable to Requires Input, new first', 'Doable', 'Requires Input', true],
    ['Requires Input to Doable, old first', 'Requires Input', 'Doable', false],
    ['Requires Input to Doable, new first', 'Requires Input', 'Doable', true]
  ])('keeps the newest market info for %s', (_, previousStage, currentStage, newFirst) => {
    const previous = investibleAt(previousStage, 1);
    const current = investibleAt(currentStage, 2);
    const batch = newFirst ? [current, previous] : [previous, current];

    const result = reducer({ 'job-1': previous }, versionsUpdateInvestibles(batch));

    expect(result['job-1']).toEqual(current);
  });

  it.each([
    ['old first', false],
    ['new first', true]
  ])('does not regress a newer stored market info when the batch arrives %s', (_, newFirst) => {
    const oldest = investibleAt('Doable', 1);
    const older = investibleAt('Requires Input', 2);
    const newest = investibleAt('Doable', 3);
    const batch = newFirst ? [older, oldest] : [oldest, older];

    const result = reducer({ 'job-1': newest }, versionsUpdateInvestibles(batch));

    expect(result['job-1']).toEqual(newest);
  });
});
