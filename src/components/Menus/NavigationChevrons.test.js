import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { MarketGroupsContext } from '../../contexts/MarketGroupsContext/MarketGroupsContext';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext';
import { LeaderContext } from '../../contexts/LeaderContext/LeaderContext';
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
  injectIntl: (Component) => Component,
  useIntl: () => ({ formatMessage: ({ id }) => id })
}));
jest.mock('react-router', () => ({
  useHistory: () => ({}),
  useLocation: () => ({ pathname: '/market-a/job-a', search: '', hash: '' })
}));
jest.mock('../../api/useInitialSyncComplete', () => ({
  useInitialSyncComplete: () => true
}));
jest.mock('../../contexts/MarketsContext/marketsContextHelper', () => ({
  getMarketDetailsForType: () => ({}),
  getNotHiddenMarketDetailsForUser: (marketsState) => marketsState,
  marketTokenLoaded: (marketId, tokensHash) => Boolean(tokensHash[marketId])
}));
jest.mock('../../contexts/NotificationsContext/notificationsContextHelper', () => ({
  dehighlightMessage: () => undefined,
  getInboxTarget: () => '',
  isInboxItemNavigationUrl: () => false,
  isInboxNavigationUrl: () => false,
  isInboxTopLevelNavigationUrl: () => false,
  isInInbox: () => false,
  messageIsSynced: () => true
}));
jest.mock('../../contexts/NotificationsContext/notificationsContextReducer', () => ({
  addNavigation: () => ({}),
  removeNavigation: () => ({})
}));
jest.mock('../../contexts/CommentsContext/commentsContextHelper', () => ({
  getOpenInvestibleComments: () => []
}));
jest.mock('../../pages/Home/YourWork/InboxExpansionPanel', () => ({
  getWorkspaceData: () => []
}));
jest.mock('../../pages/Home/YourWork/InboxContext', () => ({
  addWorkspaceGroupAttribute: (messages) => messages
}));
jest.mock('../../utils/marketIdPathFunctions', () => ({
  ASSIGNED_HASH: '',
  clearJobBackOrigin: () => undefined,
  clearNavigationOrigins: () => undefined,
  formatGroupLinkWithSuffix: () => '',
  formCommentLink: () => '',
  formInboxItemLink: () => '',
  formInvestibleLink: () => '',
  formMarketLink: () => '',
  getCanonicalNavigationUrl: () => '/market-a/job-a',
  getJobBackOrigin: () => undefined,
  isReturnableNavigationUrl: () => true,
  navigate: () => undefined,
  rememberSeenNavigationUrl: () => undefined
}));
jest.mock('../../utils/messageUtils', () => ({
  findMessagesForTypeObjectId: () => undefined
}));
jest.mock('../../utils/redirectUtils', () => ({
  getCurrentWorkspace: () => undefined,
  getGroupForInvestibleId: () => undefined
}));
jest.mock('../../pages/Home/ReturnTop', () => () => null);

function navigationChevronsTree({
  tokensHash = { 'market-a': 'token-a' },
  navigations = [{ url: '/previous', time: 1 }],
  requestFreshness = () => Promise.resolve()
} = {}) {
  const marketsState = {
    initializing: false,
    marketDetails: [{ id: 'market-a' }, { id: 'market-b' }]
  };
  return (
    <NotificationsContext.Provider value={[{
      messages: [],
      navigations
    }, jest.fn()]}>
      <MarketsContext.Provider value={[marketsState, jest.fn(), tokensHash]}>
        <MarketPresencesContext.Provider value={[{}]}>
          <CommentsContext.Provider value={[{}]}>
            <InvestiblesContext.Provider value={[{}]}>
              <MarketStagesContext.Provider value={[{}]}>
                <MarketGroupsContext.Provider value={[{}]}>
                  <SearchResultsContext.Provider value={[{ search: '' }]}>
                    <LeaderContext.Provider value={[{}, jest.fn(), {
                      requestFreshness
                    }]}>
                      <NavigationChevrons action="dialog" />
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
    container = document.createElement('div');
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
  });

  it('keeps one navigation request pending while a workspace token is missing', () => {
    const requestFreshness = jest.fn(() => Promise.resolve());
    act(() => root.render(navigationChevronsTree({ requestFreshness })));

    const next = container.querySelector('#nextNavigation');
    const back = container.querySelector('#backNavigation');
    expect(next).not.toBeNull();
    expect(back).not.toBeNull();
    expect(next.disabled).toBe(false);
    expect(back.disabled).toBe(false);
    expect(next.getAttribute('aria-disabled')).toBe('true');
    expect(back.getAttribute('aria-disabled')).toBe('true');
    act(() => back.click());
    act(() => next.click());
    expect(requestFreshness).toHaveBeenCalledTimes(1);
    expect(requestFreshness).toHaveBeenCalledWith({ reason: 'navigation' });
  });

  it('requests recovery when loaded memory has no navigation target', () => {
    const requestFreshness = jest.fn(() => Promise.resolve());
    act(() => root.render(navigationChevronsTree({
      tokensHash: { 'market-a': 'token-a', 'market-b': 'token-b' },
      navigations: [],
      requestFreshness
    })));

    const back = container.querySelector('#backNavigation');
    expect(back.disabled).toBe(false);
    expect(back.getAttribute('aria-disabled')).toBe('true');
    act(() => back.click());
    expect(requestFreshness).toHaveBeenCalledWith({ reason: 'navigation' });
  });
});
