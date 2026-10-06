import React, { act, useReducer } from 'react';
import { createRoot } from 'react-dom/client';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import { IntlProvider } from 'react-intl';
import { createTheme, ThemeProvider } from '@material-ui/core/styles';
import TaskedWizard from './ReviewNewTask/TaskedWizard';
import InvestibleEditedWizard from './JobEdited/InvestibleEditedWizard';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { NotificationsContext, EMPTY_STATE } from '../../contexts/NotificationsContext/NotificationsContext';
import reducer from '../../contexts/NotificationsContext/notificationsContextReducer';
import { isInInbox } from '../../contexts/NotificationsContext/notificationsContextHelper';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';

jest.mock('./JobDescription', () => () => null);
jest.mock('../AddNewWizards/Reply/ReplyStep', () => ({ hasReply: () => false }));
jest.mock('../../contexts/NotificationsContext/pendingClearsFlusher', () => ({
  flushPendingClears: jest.fn(),
  notificationsDispatchHack: {},
  PENDING_CLEARS_ACKED: 'PENDING_CLEARS_ACKED',
}));

const comment = { id: 'task', comment_type: 'TODO', market_id: 'market', group_id: 'group', investible_id: 'job' };
const taskMessage = { type: 'UNREAD_COMMENT', type_object_id: 'UNREAD_COMMENT_task',
  link_type: 'INVESTIBLE_REVIEW', market_id: 'market', comment_id: 'task', investible_id: 'job', is_highlighted: true };
const jobMessage = { type: 'UNREAD_DESCRIPTION', type_object_id: 'UNREAD_DESCRIPTION_job',
  market_id: 'market', investible_id: 'job', edit_list: ['UNREAD_DESCRIPTION'], is_highlighted: true };
const theme = createTheme();

describe('inbox wizard completion', () => {
  let container;
  let root;
  let history;
  let notifications;
  const previousActEnvironment = window.IS_REACT_ACT_ENVIRONMENT;

  beforeAll(() => {
    window.IS_REACT_ACT_ENVIRONMENT = true;
    window.scrollTo = jest.fn();
  });
  afterAll(() => { window.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment; });
  beforeEach(() => {
    localStorage.clear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    history = createMemoryHistory({ initialEntries: ['/inbox/notification'] });
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function renderWizard(Wizard, message, messages) {
    function Fixture() {
      const [state, dispatch] = useReducer(reducer, { ...EMPTY_STATE, messages });
      notifications = state;
      return (
        <NotificationsContext.Provider value={[state, dispatch]}>
          <Wizard marketId="market" investibleId="job" message={message} />
        </NotificationsContext.Provider>
      );
    }
    act(() => root.render(
      <ThemeProvider theme={theme}>
        <IntlProvider locale="en" messages={{ unreadJobEdit: 'Job changed', notificationDelete: 'Clear',
          NewTaskTitle: 'New task', issueReplyLabel: 'Reply', markInProgress: 'Start' }}>
          <Router history={history}>
            <CommentsContext.Provider value={[{ market: [comment] }, jest.fn()]}>
              <OperationInProgressContext.Provider value={[false, jest.fn()]}>
                <MarketsContext.Provider value={[{}]}>
                  <Fixture />
                </MarketsContext.Provider>
              </OperationInProgressContext.Provider>
            </CommentsContext.Provider>
          </Router>
        </IntlProvider>
      </ThemeProvider>
    ));
  }

  it.each([
    ['comment', TaskedWizard, taskMessage, '/dialog/market/job#ctask'],
    ['job', InvestibleEditedWizard, jobMessage, '/dialog/market/job'],
  ])('opens the changed %s after clearing its last notification through the wizard button', async (_name, Wizard, message, destination) => {
    renderWizard(Wizard, message, [message]);
    await act(async () => container.querySelector('#OnboardingWizardSkip').click());
    expect(notifications.messages.filter(isInInbox)).toHaveLength(0);
    expect(history.location.pathname + history.location.hash).toBe(destination);
  });

  it('returns to the inbox when another notification remains', async () => {
    renderWizard(InvestibleEditedWizard, jobMessage, [jobMessage, taskMessage]);
    await act(async () => container.querySelector('#OnboardingWizardSkip').click());
    expect(notifications.messages.filter(isInInbox)).toEqual([taskMessage]);
    expect(history.location.pathname).toBe('/inbox');
  });
});
