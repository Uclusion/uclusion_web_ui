import React, { act, useContext } from 'react';
import { createRoot } from 'react-dom/client';
import { NotificationsContext, NotificationsProvider, NotificationsRefreshContext } from './NotificationsContext';
import { getMessages } from '../../api/sso';

const mockListeners = {};
let mockLifecycle = 1;
let mockDiskState;
let mockDiskRead;
let mockHydrate;

jest.mock('../../api/sso', () => ({ getMessages: jest.fn() }));
jest.mock('../../api/versionedFetchUtils', () => ({
  NOTIFICATIONS_HUB_CHANNEL: 'notifications',
  VERSIONS_EVENT: 'versions',
  isRefreshLifecycleCurrent: (lifecycle) => lifecycle === mockLifecycle
}));
jest.mock('../../utils/MessageBusUtils', () => ({
  registerListener: (_channel, name, callback) => { mockListeners[name] = callback; }
}));
jest.mock('../../utils/LocalForageHelper', () => jest.fn().mockImplementation(() => ({
  getStoredState: () => mockDiskRead || Promise.resolve(mockDiskState)
})));
jest.mock('./pendingClearsFlusher', () => ({ notificationsDispatchHack: {} }));
// Keep persistence and unrelated inbox mutations outside this provider/listener regression.
jest.mock('./notificationsContextReducer', () => ({
  __esModule: true,
  NOTIFICATIONS_CONTEXT_NAMESPACE: 'notifications',
  default: (state, action) => action.newState || (action.messages === state.messages
    ? state : { ...state, messages: action.messages }),
  initializeState: (newState) => ({ newState }),
  updateMessages: (messages) => ({ messages })
}));

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((success, failure) => { resolve = success; reject = failure; });
  return { promise, resolve, reject };
}

function refresh(onlyIfIdle = false) {
  mockListeners.notificationsStart({ payload: {
    event: 'versions', refreshLifecycle: mockLifecycle, onlyIfIdle
  } });
}

function Probe() {
  const [state, , initialized, , hydrate] = useContext(NotificationsContext);
  const { refreshed, refreshing, refreshError } = useContext(NotificationsRefreshContext);
  mockHydrate = hydrate;
  return <>
    <div id="initialized">{String(initialized)}</div>
    <div id="refreshed">{String(refreshed)}</div>
    <div id="refreshing">{String(refreshing)}</div>
    <div id="error">{String(refreshError)}</div>
    <div id="messages">{state.messages.map((message) => message.id).join(',')}</div>
  </>;
}

describe('initial notification refresh', () => {
  let container;
  let root;
  let previousActEnvironment;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockLifecycle = 1;
    mockDiskState = { messages: [{ id: 'cached' }], navigations: [], pendingClears: [] };
    mockDiskRead = undefined;
    previousActEnvironment = window.IS_REACT_ACT_ENVIRONMENT;
    window.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => root.render(<NotificationsProvider><Probe /></NotificationsProvider>));
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    window.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
  });

  it('distinguishes cached hydration from a fresh server snapshot', async () => {
    expect(container.querySelector('#initialized').textContent).toBe('true');
    expect(container.querySelector('#refreshed').textContent).toBe('false');
    expect(container.querySelector('#messages').textContent).toBe('cached');
    const snapshot = deferred();
    getMessages.mockReturnValueOnce(snapshot.promise);

    act(() => refresh());
    expect(container.querySelector('#refreshed').textContent).toBe('false');
    await act(async () => snapshot.resolve([{ id: 'fresh' }]));

    expect(container.querySelector('#refreshed').textContent).toBe('true');
    expect(container.querySelector('#messages').textContent).toBe('fresh');
  });

  it('shares initial reads and keeps delivering messages during repeated overlapping version releases', async () => {
    const first = deferred();
    const trailing = deferred();
    const last = deferred();
    getMessages.mockReturnValueOnce(first.promise).mockReturnValueOnce(trailing.promise).mockReturnValueOnce(last.promise);
    act(() => {
      refresh();
      refresh(true);
    });
    expect(getMessages).toHaveBeenCalledTimes(1);
    act(() => {
      refresh();
      refresh();
    });
    await act(async () => first.resolve([{ id: 'older' }]));

    expect(getMessages).toHaveBeenCalledTimes(2);
    expect(container.querySelector('#refreshed').textContent).toBe('true');
    expect(container.querySelector('#messages').textContent).toBe('older');
    expect(container.querySelector('#refreshing').textContent).toBe('true');
    act(() => refresh());
    await act(async () => trailing.resolve([{ id: 'newer' }]));
    expect(getMessages).toHaveBeenCalledTimes(3);
    expect(container.querySelector('#messages').textContent).toBe('newer');
    expect(container.querySelector('#refreshing').textContent).toBe('true');
    await act(async () => last.resolve([{ id: 'latest' }]));
    expect(container.querySelector('#messages').textContent).toBe('latest');
    expect(container.querySelector('#refreshing').textContent).toBe('false');
  });

  it('keeps a fresh snapshot when an older follower disk read finishes afterward', async () => {
    const disk = deferred();
    mockDiskRead = disk.promise;
    let hydration;
    act(() => { hydration = mockHydrate(); });
    getMessages.mockResolvedValueOnce([{ id: 'fresh' }]);
    await act(async () => refresh());

    await act(async () => {
      disk.resolve({ messages: [], navigations: [], pendingClears: [] });
      await hydration;
    });

    expect(container.querySelector('#messages').textContent).toBe('fresh');
    expect(container.querySelector('#refreshed').textContent).toBe('true');
  });

  it('does not rerender message consumers for refresh status or an unchanged snapshot', async () => {
    const renders = jest.fn();
    function MessagesOnly() {
      const [state] = useContext(NotificationsContext);
      renders(state.messages);
      return null;
    }
    await act(async () => root.render(<NotificationsProvider><MessagesOnly /></NotificationsProvider>));
    const renderedBeforeRefresh = renders.mock.calls.length;
    const snapshot = deferred();
    getMessages.mockReturnValueOnce(snapshot.promise);

    act(() => refresh());
    expect(renders).toHaveBeenCalledTimes(renderedBeforeRefresh);
    await act(async () => snapshot.resolve(mockDiskState.messages));
    expect(renders).toHaveBeenCalledTimes(renderedBeforeRefresh);
  });

  it('allows a failed first fetch to be retried without a reload or leadership change', async () => {
    getMessages.mockRejectedValueOnce(new Error('Offline')).mockResolvedValueOnce([{ id: 'retried' }]);
    await act(async () => refresh());
    expect(container.querySelector('#refreshed').textContent).toBe('false');
    expect(container.querySelector('#error').textContent).toBe('true');

    await act(async () => refresh());

    expect(container.querySelector('#messages').textContent).toBe('retried');
    expect(container.querySelector('#refreshed').textContent).toBe('true');
    expect(container.querySelector('#error').textContent).toBe('false');
  });

  it('keeps a fetch failure visible while a queued request retries it', async () => {
    const first = deferred();
    const trailing = deferred();
    getMessages.mockReturnValueOnce(first.promise).mockReturnValueOnce(trailing.promise);
    act(() => {
      refresh();
      refresh();
    });
    await act(async () => first.reject(new Error('Offline')));

    expect(container.querySelector('#error').textContent).toBe('true');
    expect(container.querySelector('#refreshing').textContent).toBe('true');
    await act(async () => trailing.resolve([{ id: 'recovered' }]));
    expect(container.querySelector('#error').textContent).toBe('false');
  });

  it('ignores a response from a relinquished lifecycle while the new leader refresh completes', async () => {
    const old = deferred();
    const current = deferred();
    getMessages.mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
    act(() => refresh());
    mockLifecycle += 1;
    act(() => refresh());
    await act(async () => current.resolve([{ id: 'current' }]));
    await act(async () => old.resolve([{ id: 'old-leader' }]));

    expect(container.querySelector('#messages').textContent).toBe('current');
    expect(container.querySelector('#error').textContent).toBe('false');
  });
});
