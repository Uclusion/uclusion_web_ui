import {
  configureFreshnessTab,
  FRESHNESS_NAMESPACES,
  registerNamespaceReloader,
  requestFreshness
} from './crossTabFreshness';

jest.mock('../utils/logoutState', () => ({ isSignedOut: () => false }));

describe('follower notification dependency requests', () => {
  let unregister;
  let tab;
  let reloaders;

  beforeEach(() => {
    tab = { isLeader: false, send: jest.fn(), call: jest.fn(() => Promise.resolve(false)) };
    reloaders = Object.fromEntries(Object.values(FRESHNESS_NAMESPACES)
      .map((namespace) => [namespace, jest.fn(() => Promise.resolve())]));
    unregister = [configureFreshnessTab(tab), ...Object.entries(reloaders)
      .map(([namespace, reload]) => registerNamespaceReloader(namespace, reload))];
  });

  afterEach(() => unregister.forEach((remove) => remove()));

  it.each([false, true])('preserves the reporting tab snapshot while forwarding dependencies (heartbeat=%s)', async (heartbeat) => {
    const request = { reason: 'notificationDependencies', heartbeat,
      dependencies: [{ marketId: 'market', commentId: 'comment', version: 2 }] };

    await requestFreshness(request);

    expect(tab.call).toHaveBeenCalledWith('freshness.refresh', request);
    expect(reloaders[FRESHNESS_NAMESPACES.NOTIFICATIONS]).not.toHaveBeenCalled();
    Object.entries(reloaders).filter(([namespace]) => namespace !== FRESHNESS_NAMESPACES.NOTIFICATIONS)
      .forEach(([, reload]) => expect(reload).toHaveBeenCalledTimes(heartbeat ? 0 : 1));
  });

  it('adopts an already-fetched comment without replacing the current message list', async () => {
    const follower = { messages: ['new-message'], comments: [] };
    reloaders[FRESHNESS_NAMESPACES.COMMENTS].mockImplementation(() => {
      follower.comments = ['comment'];
      return Promise.resolve();
    });
    reloaders[FRESHNESS_NAMESPACES.NOTIFICATIONS].mockImplementation(() => {
      follower.messages = [];
      return Promise.resolve();
    });

    await requestFreshness({ reason: 'notificationDependencies',
      dependencies: [{ marketId: 'market', commentId: 'comment', version: 2 }] });

    expect(follower).toEqual({ messages: ['new-message'], comments: ['comment'] });
  });

  it('still adopts shared state before an ordinary view-change refresh', async () => {
    const request = { reason: 'viewChange' };

    await requestFreshness(request);

    Object.values(reloaders).forEach((reload) => expect(reload).toHaveBeenCalledTimes(1));
    expect(tab.call).toHaveBeenCalledWith('freshness.refresh', request);
  });
});
