import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { createMemoryHistory } from 'history';
import { useHistory, useLocation } from 'react-router';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { MarketGroupsContext } from '../../contexts/MarketGroupsContext/MarketGroupsContext';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext';
import { LeaderContext } from '../../contexts/LeaderContext/LeaderContext';
import { SyncedMessagesContext } from '../../contexts/SyncedMessagesContext/SyncedMessagesContext';
import { navigate } from '../../utils/marketIdPathFunctions';
import NavigationChevrons from './NavigationChevrons';

jest.mock('../../contexts/CommentsContext/CommentsContext', () => {
  const React = require('react');
  return { CommentsContext: React.createContext() };
});
jest.mock('../../contexts/InvestibesContext/InvestiblesContext', () => {
  const React = require('react');
  return { InvestiblesContext: React.createContext() };
});
jest.mock('../../contexts/MarketGroupsContext/MarketGroupsContext', () => {
  const React = require('react');
  return { MarketGroupsContext: React.createContext() };
});
jest.mock('../../contexts/MarketPresencesContext/MarketPresencesContext', () => {
  const React = require('react');
  return { MarketPresencesContext: React.createContext() };
});
jest.mock('../../contexts/MarketsContext/MarketsContext', () => {
  const React = require('react');
  return { MarketsContext: React.createContext() };
});
jest.mock('../../contexts/MarketStagesContext/MarketStagesContext', () => {
  const React = require('react');
  return { MarketStagesContext: React.createContext() };
});
jest.mock('../../contexts/NotificationsContext/NotificationsContext', () => {
  const React = require('react');
  return { NotificationsContext: React.createContext() };
});
jest.mock('../../contexts/SearchResultsContext/SearchResultsContext', () => {
  const React = require('react');
  return { SearchResultsContext: React.createContext() };
});
jest.mock('../../contexts/LeaderContext/LeaderContext', () => {
  const React = require('react');
  return {
    LeaderContext: React.createContext([{}, jest.fn(), {
      requestFreshness: () => Promise.resolve()
    }])
  };
});
// J-all-440: the synced pass and its recovery live in the provider now, so this component test
// supplies the set directly. The provider's own behavior is covered in SyncedMessagesContext.test.js.
jest.mock('../../contexts/SyncedMessagesContext/SyncedMessagesContext', () => {
  const React = require('react');
  return { SyncedMessagesContext: React.createContext({ syncedMessages: [], stillLoading: true }) };
});
jest.mock('@material-ui/core/Toolbar', () => ({ children }) => <div>{children}</div>);
jest.mock('@material-ui/core', () => ({
  Button: ({ children, disabled, id, onClick, 'aria-disabled': ariaDisabled }) => (
    <button disabled={disabled} id={id} onClick={onClick} aria-disabled={ariaDisabled}>{children}</button>
  ),
  Tooltip: ({ children }) => <>{children}</>,
  makeStyles: () => () => ({ magicButton: 'magicButton' }),
  useMediaQuery: () => false,
  useTheme: () => ({ breakpoints: { down: () => '(max-width: 960px)' } })
}));
jest.mock('@material-ui/icons', () => ({
  ArrowBack: () => null,
  ArrowForward: () => null,
  ArrowUpward: () => null
}));
jest.mock('react-hotkeys-hook', () => ({ useHotkeys: () => undefined }));
jest.mock('react-intl', () => ({
  ...jest.requireActual('react-intl'),
  injectIntl: (Component) => Component,
  useIntl: () => ({ formatMessage: ({ id }) => id })
}));
jest.mock('react-router', () => ({
  useHistory: jest.fn(),
  useLocation: jest.fn()
}));
jest.mock('../../api/useInitialSyncComplete', () => ({
  useInitialSyncComplete: () => true
}));
jest.mock('../../contexts/MarketsContext/marketsContextHelper', () => ({
  getMarketDetailsForType: () => ({}),
  getNotHiddenMarketDetailsForUser: (marketsState) => marketsState,
  marketTokenLoaded: (marketId, tokensHash) => Boolean(tokensHash[marketId]),
  getMarket: (state, id) => state.marketDetails?.find((market) => market.id === id)
}));
jest.mock('../../contexts/NotificationsContext/notificationsContextHelper', () => ({
  dehighlightMessage: () => undefined,
  getInboxTarget: () => '/inbox',
  getMessageId: (message) => message.type_object_id,
  getNotificationSyncState: (messages) => ({
    syncedMessages: [],
    dependencies: (messages || []).map((message) => ({
      marketId: message.comment_market_id || message.market_id,
      commentId: message.comment_id,
      version: message.comment_version
    }))
  }),
  isInboxItemNavigationUrl: (url = '') => ['/inbox/', '/outbox/', 'outbox/'].some((prefix) => url.startsWith(prefix)),
  isInboxNavigationUrl: (url = '') => ['/inbox', '/outbox', 'outbox/'].some((prefix) => url.startsWith(prefix)),
  isInboxTopLevelNavigationUrl: (url = '') => ['/inbox', '/outbox'].includes(url.split(/[?#]/)[0])
}));
jest.mock('../../contexts/NotificationsContext/notificationsContextReducer', () => ({
  addNavigation: (url) => ({ type: 'ADD_NAVIGATION', url }),
  removeNavigation: (url) => ({ type: 'REMOVE_NAVIGATION', url })
}));
jest.mock('../../contexts/CommentsContext/commentsContextHelper', () => ({
  getOpenInvestibleComments: () => [],
  getComment: (state, marketId, id) => state[marketId]?.find((comment) => comment.id === id),
  getCommentRoot: (state, marketId, id) => state[marketId]?.find((comment) => comment.id === id)
}));
jest.mock('../../contexts/InvestibesContext/investiblesContextHelper', () => ({
  getInvestibleName: () => undefined
}));
jest.mock('../../pages/Home/YourWork/InboxExpansionPanel', () => ({
  getWorkspaceData: () => []
}));
jest.mock('../../pages/Home/YourWork/InboxContext', () => ({
  addWorkspaceGroupAttribute: (messages) => messages
}));
jest.mock('../../utils/marketIdPathFunctions', () => ({
  ...jest.requireActual('../../utils/marketIdPathFunctions'),
  navigate: jest.fn()
}));
jest.mock('../../utils/messageUtils', () => ({
  findMessagesForTypeObjectId: () => undefined
}));
jest.mock('../../utils/redirectUtils', () => ({
  getCurrentWorkspace: () => undefined,
  getGroupForInvestibleId: () => undefined
}));
jest.mock('../../pages/Home/ReturnTop', () => () => null);

const navigation = jest.requireActual('../../utils/marketIdPathFunctions');
const { getNotificationSyncState } = jest.requireActual(
  '../../contexts/NotificationsContext/notificationsContextHelper');

function navigationChevronsTree({
  tokensHash = { 'market-a': 'token-a' },
  navigations = [{ url: '/previous', time: 1 }],
  messages = [],
  syncedMessages = [],
  commentsState = {},
  searchText = '',
  stillLoading = false,
  messagesDispatch = jest.fn(),
  requestFreshness = () => Promise.resolve()
} = {}) {
  const marketsState = {
    initializing: false,
    marketDetails: [{ id: 'market-a' }, { id: 'market-b' }]
  };
  return (
    <NotificationsContext.Provider value={[{
      messages,
      navigations
    }, messagesDispatch, true]}>
      <MarketsContext.Provider value={[marketsState, jest.fn(), tokensHash]}>
        <MarketPresencesContext.Provider value={[{}]}>
          <CommentsContext.Provider value={[commentsState]}>
            <InvestiblesContext.Provider value={[{}]}>
              <MarketStagesContext.Provider value={[{}]}>
                <MarketGroupsContext.Provider value={[{}]}>
                  <SearchResultsContext.Provider value={[{ search: searchText }]}>
                    <LeaderContext.Provider value={[{}, jest.fn(), {
                      requestFreshness
                    }]}>
                      <SyncedMessagesContext.Provider value={{ syncedMessages, dependencies: [], stillLoading }}>
                        <NavigationChevrons action="dialog" />
                      </SyncedMessagesContext.Provider>
                    </LeaderContext.Provider>
                  </SearchResultsContext.Provider>
                </MarketGroupsContext.Provider>
              </MarketStagesContext.Provider>
            </InvestiblesContext.Provider>
          </CommentsContext.Provider>
        </MarketPresencesContext.Provider>
      </MarketsContext.Provider>
    </NotificationsContext.Provider>
  );
}

describe('NavigationChevrons', () => {
  let container;
  let root;
  const previousActEnvironment = window.IS_REACT_ACT_ENVIRONMENT;

  beforeAll(() => {
    window.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterAll(() => {
    window.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
  });

  beforeEach(() => {
    useHistory.mockReturnValue({});
    useLocation.mockReturnValue({ pathname: '/market-a/job-a', search: '', hash: '' });
    navigate.mockReset();
    navigation.clearNavigationOrigins();
    container = document.createElement('div');
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
  });

  describe('Back after a job description link', () => {
    const sourceUrl = '/dialog/market-a/job-a';
    const destinationUrl = '/dialog/market-a/job-b';
    const aliasUrl = '/market-a/J-all-433';
    const ticketState = {
      'market-a/J-all-433': { marketId: 'market-a', investibleId: 'job-b' }
    };

    beforeEach(() => {
      jest.useFakeTimers();
      jest.spyOn(window, 'scrollTo').mockImplementation(() => {});
      navigate.mockImplementation(navigation.navigate);
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    function renderBack(history, navigations) {
      useHistory.mockReturnValue(history);
      useLocation.mockImplementation(() => history.location);
      act(() => root.render(navigationChevronsTree({
        tokensHash: { 'market-a': 'token-a', 'market-b': 'token-b' },
        navigations
      })));
      return container.querySelector('#backNavigation');
    }

    it.each([aliasUrl, destinationUrl])('returns to the source job after following %s', (linkUrl) => {
      const history = createMemoryHistory({ initialEntries: [sourceUrl] });
      navigation.rememberSeenNavigationUrl(sourceUrl);
      navigation.navigate(history, linkUrl);
      navigation.rememberSeenNavigationUrl(navigation.getCanonicalNavigationUrl(
        history.location.pathname, history.location.search));
      const redirect = navigation.getTicketRedirectUrl(history.location.pathname, '', ticketState, {}, {});
      if (redirect) {
        navigation.navigate(history, redirect, true);
        jest.runOnlyPendingTimers();
      }
      expect(history.location.pathname).toBe(destinationUrl);

      const back = renderBack(history, [{ url: navigation.getJobBackOrigin(), time: 1 }]);
      expect(back.disabled).toBe(false);
      act(() => back.click());

      expect(history.location.pathname).toBe(sourceUrl);
    });

    it('keeps Back disabled when a job alias was opened without an in-app source', () => {
      const history = createMemoryHistory({ initialEntries: [aliasUrl] });
      navigation.rememberSeenNavigationUrl(aliasUrl);
      navigation.navigate(history,
        navigation.getTicketRedirectUrl(aliasUrl, '', ticketState, {}, {}), true);
      jest.runOnlyPendingTimers();
      const origin = navigation.getJobBackOrigin();

      const back = renderBack(history, origin ? [{ url: origin, time: 1 }] : []);

      expect(back.disabled).toBe(true);
    });

    it('skips an old alias entry when returning to the previous job', () => {
      const history = createMemoryHistory({ initialEntries: [destinationUrl] });
      const back = renderBack(history, [
        { url: sourceUrl, time: 1 },
        { url: aliasUrl, time: 2 }
      ]);

      act(() => back.click());

      expect(history.location.pathname).toBe(sourceUrl);
    });
  });

  // J-all-440: the component is told whether the synced set is ready; deriving that from market
  // tokens is the provider's job and is covered in SyncedMessagesContext.test.js.
  it('disables navigation while the synced set is still loading', () => {
    const requestFreshness = jest.fn(() => Promise.resolve());
    act(() => root.render(navigationChevronsTree({ requestFreshness, stillLoading: true })));

    requestFreshness.mockClear();
    const next = container.querySelector('#nextNavigation');
    const back = container.querySelector('#backNavigation');
    expect(next).not.toBeNull();
    expect(back).not.toBeNull();
    expect(next.disabled).toBe(true);
    expect(back.disabled).toBe(true);
    expect(next.getAttribute('aria-disabled')).toBe('true');
    expect(back.getAttribute('aria-disabled')).toBe('true');
    act(() => back.click());
    act(() => next.click());
    expect(requestFreshness).not.toHaveBeenCalled();
  });

  it('disables Forward when loaded state has no navigation target', () => {
    const requestFreshness = jest.fn(() => Promise.resolve());
    act(() => root.render(navigationChevronsTree({
      tokensHash: { 'market-a': 'token-a', 'market-b': 'token-b' },
      navigations: [],
      requestFreshness
    })));

    requestFreshness.mockClear();
    const next = container.querySelector('#nextNavigation');
    expect(next.disabled).toBe(true);
    expect(next.getAttribute('aria-disabled')).toBe('true');
    act(() => next.click());
    expect(requestFreshness).not.toHaveBeenCalled();
  });

  it('disables Back after its last navigation target is consumed', () => {
    const messagesDispatch = jest.fn();
    const requestFreshness = jest.fn(() => Promise.resolve());
    act(() => root.render(navigationChevronsTree({
      tokensHash: { 'market-a': 'token-a', 'market-b': 'token-b' },
      messagesDispatch,
      requestFreshness
    })));

    requestFreshness.mockClear();
    navigate.mockClear();
    const enabledBack = container.querySelector('#backNavigation');
    expect(enabledBack.disabled).toBe(false);
    act(() => enabledBack.click());
    expect(messagesDispatch).toHaveBeenCalledWith({ type: 'REMOVE_NAVIGATION', url: '/previous' });
    expect(navigate).toHaveBeenCalledWith(expect.any(Object), '/previous');

    act(() => root.render(navigationChevronsTree({
      tokensHash: { 'market-a': 'token-a', 'market-b': 'token-b' },
      navigations: [],
      messagesDispatch,
      requestFreshness
    })));

    const back = container.querySelector('#backNavigation');
    expect(back.disabled).toBe(true);
    expect(back.getAttribute('aria-disabled')).toBe('true');
    act(() => back.click());
    expect(requestFreshness).not.toHaveBeenCalled();
  });

  it('disables Back while a remembered inbox target is not synced', () => {
    const requestFreshness = jest.fn(() => Promise.resolve());
    act(() => root.render(navigationChevronsTree({
      tokensHash: { 'market-a': 'token-a', 'market-b': 'token-b' },
      navigations: [{ url: '/inbox/stale', time: 1 }],
      requestFreshness
    })));

    requestFreshness.mockClear();
    const back = container.querySelector('#backNavigation');
    expect(back.disabled).toBe(true);
    expect(back.getAttribute('aria-disabled')).toBe('true');
    act(() => back.click());
    expect(requestFreshness).not.toHaveBeenCalled();
  });

  it('visits successive anchors on the same job and another job without replacing the real Back origin', () => {
    const commentsState = { 'market-a': [
      { id: 'first', version: 2, comment_type: 'QUESTION', investible_id: 'job-a' },
      { id: 'second', version: 2, comment_type: 'REPORT', investible_id: 'job-a' },
      { id: 'third', version: 2, comment_type: 'SUGGEST', investible_id: 'job-b' }
    ] };
    const messages = commentsState['market-a'].map((comment, index) => ({
      type: 'UNREAD_COMMENT', type_object_id: `UNREAD_COMMENT_${comment.id}`,
      comment_id: comment.id, market_id: 'market-a',
      comment_list: [comment.id], comment_version: 2,
      is_highlighted: index > 0, updated_at: 3 - index
    }));
    const origin = '/dialog/market-a/origin-job';
    const messagesDispatch = jest.fn();
    const history = {};
    useHistory.mockReturnValue(history);
    useLocation.mockReturnValue({ pathname: '/dialog/market-a/job-a', search: '', hash: '#cfirst',
      state: { notification: { id: messages[0].type_object_id } } });
    // Use the real shared classification with the production string-ID list before data arrives.
    const oldComments = { 'market-a': commentsState['market-a'].map((comment) => ({ ...comment, version: 1 })) };
    [{}, oldComments].forEach((pendingComments) => {
      const { syncedMessages } = getNotificationSyncState(messages, {}, {}, pendingComments, {}, {});
      act(() => root.render(navigationChevronsTree({ commentsState: pendingComments, messages, syncedMessages,
        navigations: [{ url: origin, time: 1 }], messagesDispatch })));
      const next = container.querySelector('#nextNavigation');
      expect(next.disabled).toBe(true);
      act(() => next.click());
      expect(navigate).not.toHaveBeenCalled();
    });
    const { syncedMessages } = getNotificationSyncState(messages, {}, {}, commentsState, {}, {});
    act(() => root.render(navigationChevronsTree({ commentsState, messages, syncedMessages,
      navigations: [{ url: origin, time: 1 }], messagesDispatch })));
    act(() => container.querySelector('#nextNavigation').click());
    expect(navigate).toHaveBeenLastCalledWith(history, '/dialog/market-a/job-a#csecond', false, false,
      { notification: { id: messages[1].type_object_id, marketId: 'market-a', commentId: 'second' } });
    const nextMessages = messages.map((message) => ({ ...message,
      is_highlighted: message.comment_id === 'third' }));
    useLocation.mockReturnValue({ pathname: '/dialog/market-a/job-a', search: '', hash: '',
      state: { notification: { id: messages[1].type_object_id } } });
    act(() => root.render(navigationChevronsTree({ commentsState, messages: nextMessages,
      syncedMessages: nextMessages, navigations: [{ url: origin, time: 1 }], messagesDispatch })));
    act(() => container.querySelector('#nextNavigation').click());
    expect(navigate).toHaveBeenLastCalledWith(history, '/dialog/market-a/job-b#cthird', false, false,
      { notification: { id: messages[2].type_object_id, marketId: 'market-a', commentId: 'third' } });
    expect(messagesDispatch.mock.calls.some(([action]) => action.type === 'ADD_NAVIGATION')).toBe(false);
    act(() => container.querySelector('#backNavigation').click());
    expect(navigate).toHaveBeenLastCalledWith(history, origin);

    // A direct row opened from a filtered inbox keeps that actual list as its return point.
    act(() => root.render(navigationChevronsTree({ commentsState, messages: nextMessages,
      syncedMessages: nextMessages, searchText: 'report',
      navigations: [{ url: '/inbox', time: 1 }], messagesDispatch })));
    expect(container.querySelector('#nextNavigation')).toBeNull();
    expect(container.querySelector('#backNavigation').disabled).toBe(false);
    act(() => container.querySelector('#backNavigation').click());
    expect(navigate).toHaveBeenLastCalledWith(history, '/inbox');
  });

});
