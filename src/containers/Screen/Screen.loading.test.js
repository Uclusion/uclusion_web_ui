import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Router } from 'react-router';
import { createMemoryHistory } from 'history';
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from '@material-ui/core/styles';
import { defaultTheme } from '../../config/themes';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { MarketGroupsContext } from '../../contexts/MarketGroupsContext/MarketGroupsContext';
import { GroupMembersContext } from '../../contexts/GroupMembersContext/GroupMembersContext';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import Screen from './Screen';

jest.mock('../Header', () => ({ hidden }) => hidden ? null : <header>Workspace header</header>);
jest.mock('../../components/Menus/Sidebar', () => ({ marketId }) => (
  <nav data-market-id={marketId}>Workspace navigation</nav>
));
jest.mock('../../pages/Dialog/Planning/DialogOutset', () => ({ DIALOG_OUTSET_STATE_HACK: {} }));
jest.mock('../../pages/Home/OtherWorkspaceMenus', () => () => null);

it('keeps desktop navigation hidden with loading until workspace content is ready', () => {
  const previousActEnvironment = window.IS_REACT_ACT_ENVIRONMENT;
  window.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  const root = createRoot(container);
  const history = createMemoryHistory({ initialEntries: ['/'] });
  const contexts = [
    [AccountContext, { user: { onboarding_state: 'FIRST_MARKET_JOINED' } }],
    [MarketsContext, { marketDetails: [{ id: 'workspace', name: 'Existing workspace', market_type: 'PLANNING', market_stage: 'Active' }] }],
    [MarketPresencesContext, { workspace: [{ current_user: true }] }],
    [MarketGroupsContext, {}],
    [GroupMembersContext, {}],
    [NotificationsContext, { messages: [] }],
    [SearchResultsContext, { search: '', results: [] }],
    [InvestiblesContext, {}],
    [CommentsContext, {}],
  ];
  function renderScreen(loading) {
    const screen = contexts.reduceRight((children, [Context, state]) => (
      <Context.Provider value={[state, jest.fn()]}>{children}</Context.Provider>
    ), <Screen loading={loading}><main>Workspace content</main></Screen>);
    act(() => {
      root.render(
        <Router history={history}>
          <ThemeProvider theme={defaultTheme}>
            <IntlProvider locale="en" messages={{ loadingMessage: 'Loading' }}>
              {screen}
            </IntlProvider>
          </ThemeProvider>
        </Router>
      );
    });
  }

  try {
    renderScreen(true);
    expect(container.querySelector('#spinner')).not.toBeNull();
    expect(container.querySelector('nav')).toBeNull();
    expect(container.querySelector('main')).toBeNull();

    renderScreen(false);
    expect(container.querySelector('#spinner')).toBeNull();
    expect(container.querySelector('nav').getAttribute('data-market-id')).toBe('workspace');
    expect(container.querySelector('main').textContent).toBe('Workspace content');
  } finally {
    act(() => root.unmount());
    window.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
  }
});
