import React, { act, useContext } from 'react';
import { createRoot } from 'react-dom/client';
import { NotificationsContext, NotificationsProvider } from './NotificationsContext';
import { removeMessages } from './notificationsContextReducer';
import { cacheNeedsRebuild, cancelCacheRecoveryWrites, completeCacheRebuild } from '../../utils/applicationCacheRecovery';
import { waitForPendingWrites } from '../../api/crossTabFreshness';

let mockRead;
let mockIsLeader = false;
const mockSetItem = jest.fn().mockResolvedValue(true);
let current;
jest.mock('localforage', () => ({
  createInstance: () => ({ getItem: () => mockRead, setItem: mockSetItem })
}));
jest.mock('../../utils/MessageBusUtils', () => ({ registerListener: jest.fn(), pushMessage: jest.fn() }));
jest.mock('../../api/versionedFetchUtils', () => ({
  NOTIFICATIONS_HUB_CHANNEL: 'notifications', VERSIONS_EVENT: 'versions',
  isRefreshLifecycleCurrent: () => true
}));
jest.mock('../LeaderContext/LeaderContext', () => ({
  leaderContextHack: { get isLeader() { return mockIsLeader; } }
}));
jest.mock('./pendingClearsFlusher', () => ({
  notificationsDispatchHack: {}, flushPendingClears: jest.fn(), PENDING_CLEARS_ACKED: 'acked'
}));

function Probe() {
  current = useContext(NotificationsContext);
  return null;
}

it('preserves a queued local clear when disk hydration fails in the same React batch', async () => {
  const priorActEnvironment = window.IS_REACT_ACT_ENVIRONMENT;
  window.IS_REACT_ACT_ENVIRONMENT = true;
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const container = document.createElement('div');
  const root = createRoot(container);
  mockRead = Promise.resolve({ messages: [{ type_object_id: 'message-1', market_id: 'workspace' }],
    navigations: [], pendingClears: [] });
  try {
    await act(async () => root.render(<NotificationsProvider><Probe /></NotificationsProvider>));
    let rejectRead;
    mockRead = new Promise((resolve, reject) => { rejectRead = reject; });
    let hydration;
    act(() => { hydration = current[4](); });
    await act(async () => {
      current[1](removeMessages(['message-1']));
      rejectRead(new DOMException('Failed to read large IndexedDB value', 'UnknownError'));
      await hydration;
    });
    expect(current[0].messages[0].deleted).toBe(true);
    expect(current[0].pendingClears).toEqual([
      { typeObjectId: 'message-1', marketId: 'workspace', event: 'remove' }
    ]);
    expect(current[2]).toBe(true);
  } finally {
    act(() => root.unmount());
    warning.mockRestore();
    window.IS_REACT_ACT_ENVIRONMENT = priorActEnvironment;
  }
});

it('does not replay a queued notification recovery snapshot after leadership changes', async () => {
  const priorActEnvironment = window.IS_REACT_ACT_ENVIRONMENT;
  window.IS_REACT_ACT_ENVIRONMENT = true;
  const root = createRoot(document.createElement('div'));
  mockRead = Promise.resolve({ messages: [{ type_object_id: 'message-2', market_id: 'workspace' }],
    navigations: [], pendingClears: [] });
  mockSetItem.mockClear();
  try {
    await act(async () => root.render(<NotificationsProvider><Probe /></NotificationsProvider>));
    cacheNeedsRebuild('notifications');
    mockIsLeader = true;
    act(() => current[1](removeMessages(['message-2'])));
    mockIsLeader = false;
    cancelCacheRecoveryWrites();
    await waitForPendingWrites();
    await completeCacheRebuild(['notifications']);
    await waitForPendingWrites();
    expect(mockSetItem).not.toHaveBeenCalled();
    expect(current[0].pendingClears).toHaveLength(1);
    // The new leader's server-derived disk snapshot does not know the old
    // tab's unacknowledged clear. Adopting it must preserve that local intent.
    mockRead = Promise.resolve({ messages: [{ type_object_id: 'message-2', market_id: 'workspace' }],
      navigations: [], pendingClears: [] });
    await act(async () => { await current[4](); });
    expect(current[0].messages[0].deleted).toBe(true);
    expect(current[0].pendingClears).toEqual([
      { typeObjectId: 'message-2', marketId: 'workspace', event: 'remove' }
    ]);
  } finally {
    mockIsLeader = false;
    act(() => root.unmount());
    window.IS_REACT_ACT_ENVIRONMENT = priorActEnvironment;
  }
});
