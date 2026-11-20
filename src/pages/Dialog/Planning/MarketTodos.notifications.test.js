import React, { act, useReducer, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from '@material-ui/core/styles';
import MarketTodos from './MarketTodos';
import { darkTheme, defaultTheme } from '../../../config/themes';
import messages from '../../../config/locales/en';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { SearchResultsContext } from '../../../contexts/SearchResultsContext/SearchResultsContext';
import { getMarketClient } from '../../../api/marketLogin';
import { removeWorkListItem } from '../../Home/YourWork/WorkListItem';
import notificationsReducer from '../../../contexts/NotificationsContext/notificationsContextReducer';

jest.mock('../../../api/marketLogin', () => ({ getMarketClient: jest.fn() }));
jest.mock('../../Home/YourWork/WorkListItem', () => ({ removeWorkListItem: jest.fn() }));
jest.mock('../../../components/Comments/Comment', () => () => null);
jest.mock('../../../components/Comments/BugMenu', () => () => null);
jest.mock('../Decision/OptionVoting', () => () => null);
jest.mock('../../../components/AddNewWizards/Bug/BugDescriptionStep', () => ({ hasBug: () => false }));
jest.mock('../../../components/Notifications/DismissableText', () => () => null);
jest.mock('../../../utils/openChipNotification', () => ({ useOpenChipNotification: () => jest.fn() }));
jest.mock('react-hotkeys-hook', () => ({ useHotkeys: () => {} }));
jest.mock('../../../contexts/NotificationsContext/pendingClearsFlusher', () => ({
  flushPendingClears: jest.fn(), PENDING_CLEARS_ACKED: 'PENDING_CLEARS_ACKED',
}));

const bug = { id: 'bug', body: 'Bug with notifications', comment_type: 'TODO',
  notification_type: 'RED', updated_at: '2026-11-16T00:00:00Z' };
const reply = { id: 'reply', root_comment_id: bug.id, reply_id: bug.id, comment_type: 'REPLY' };
const nestedReply = { id: 'nested-reply', root_comment_id: bug.id, reply_id: reply.id, comment_type: 'REPLY' };
const notification = (id, commentId, extra = {}) => ({
  market_id: 'workspace', type: 'UNREAD_REPLY', type_object_id: `UNREAD_REPLY_${id}`,
  comment_id: commentId, is_highlighted: false, ...extra,
});

function OperationProvider({ children }) {
  const operation = useState(false);
  return <OperationInProgressContext.Provider value={operation}>{children}</OperationInProgressContext.Provider>;
}

describe('bug row notification clear', () => {
  let container;
  let root;
  let messagesDispatch;
  let removeNotifications;
  let currentMessagesState;
  const originalMatchMedia = window.matchMedia;
  const previousActEnvironment = window.IS_REACT_ACT_ENVIRONMENT;

  beforeAll(() => { window.IS_REACT_ACT_ENVIRONMENT = true; });
  afterAll(() => {
    window.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
    window.matchMedia = originalMatchMedia;
  });
  beforeEach(() => {
    jest.clearAllMocks();
    messagesDispatch = jest.fn();
    removeNotifications = jest.fn().mockResolvedValue(true);
    getMarketClient.mockResolvedValue({ users: { removeNotifications } });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  function MessagesProvider({ notifications, children }) {
    const [state, dispatch] = useReducer(notificationsReducer,
      { messages: notifications, navigations: [], pendingClears: [] });
    currentMessagesState = state;
    return <NotificationsContext.Provider value={[state, (action) => {
      messagesDispatch(action);
      dispatch(action);
    }]}>{children}</NotificationsContext.Provider>;
  }

  function renderBugs(notifications, { mobile = false, dark = false, resolved = false } = {}) {
    window.matchMedia = () => ({ matches: mobile, addListener() {}, removeListener() {} });
    const comments = [{ ...bug, resolved }, reply, nestedReply];
    act(() => root.render(
      <MemoryRouter>
        <ThemeProvider theme={dark ? darkTheme : defaultTheme}>
          <IntlProvider locale="en" messages={messages}>
            <CommentsContext.Provider value={[{ workspace: comments }, jest.fn()]}>
              <MessagesProvider notifications={notifications}>
                <SearchResultsContext.Provider value={[{ results: [], parentResults: [], search: '' }, jest.fn()]}>
                  <OperationProvider>
                    <MarketTodos marketId="workspace" groupId="view" sectionOpen setSectionOpen={jest.fn()}
                      comments={resolved ? [] : comments} resolvedTodoComments={resolved ? comments : []} />
                  </OperationProvider>
                </SearchResultsContext.Provider>
              </MessagesProvider>
            </CommentsContext.Provider>
          </IntlProvider>
        </ThemeProvider>
      </MemoryRouter>
    ));
    if (resolved) {
      act(() => container.querySelectorAll('[role="tab"]')[3].click());
    }
    return container.querySelector('#inboxClearBugbug');
  }

  it.each([[false, false], [true, false], [false, true], [true, true]])(
    'clears the bug thread without expanding the row (mobile: %s, dark: %s)', async (mobile, dark) => {
    const rootMessage = notification('root', bug.id);
    const replyMessage = notification('reply', reply.id, { is_highlighted: true });
    const nestedMessage = notification('nested', nestedReply.id);
    const aiMessage = notification('ai', bug.id, {
      type: 'NEW_TODO', type_object_id: 'NEW_TODO_ai', alert_type: 'AI_GENERATED',
    });
    const required = notification('required', bug.id, {
      type: 'NEW_TODO', type_object_id: 'NEW_TODO_required', is_highlighted: true,
    });
    const ignored = [
      notification('other-bug', 'other-bug'),
      notification('deleted', bug.id, { deleted: true }),
      notification('report', bug.id, { type: 'UNREAD_REPORT' }),
      notification('other-workspace', bug.id, { market_id: 'other-workspace' }),
    ];
    const button = renderBugs([rootMessage, replyMessage, nestedMessage, aiMessage, required, ...ignored], { mobile, dark });
    expect(button.disabled).toBe(false);
    expect(button.getAttribute('aria-label')).toBe("Clear all of this bug's notifications");
    if (dark) {
      expect(button.querySelector('svg').getAttribute('color')).toBe('#b0b0b0');
      expect(window.getComputedStyle(button).backgroundColor).toBe('rgb(58, 74, 76)');
    }
    act(() => button.focus());
    expect(document.activeElement).toBe(button);
    await act(async () => button.click());

    expect(removeNotifications).toHaveBeenCalledTimes(1);
    expect(removeNotifications).toHaveBeenCalledWith(
      [rootMessage, replyMessage, nestedMessage, aiMessage, required].map((message) => message.type_object_id), true);
    expect(removeWorkListItem.mock.calls.map(([message]) => message)).toEqual(
      [rootMessage, replyMessage, nestedMessage, aiMessage]);
    expect(messagesDispatch).toHaveBeenCalledWith(expect.objectContaining({
      type: 'DEHIGHLIGHT_MESSAGES', messages: [required.type_object_id],
    }));
    expect(container.querySelector('#bugListItemExpansionbug').style.display).toBe('none');
    expect(button.disabled).toBe(false);
  });

  it('hides the clear button when the bug has no inbox notifications', () => {
    const button = renderBugs([
      notification('other', 'other-bug'),
      notification('deleted', bug.id, { deleted: true }),
      notification('report', bug.id, { type: 'UNREAD_REPORT' }),
    ]);
    expect(button).toBeNull();
    expect(removeNotifications).not.toHaveBeenCalled();
    expect(container.querySelector('#bugListItemExpansionbug').style.display).toBe('none');
  });

  it('includes replies in the resolved bug tab', async () => {
    const message = notification('resolved-reply', nestedReply.id);
    const button = renderBugs([message], { resolved: true });
    await act(async () => button.click());
    expect(removeNotifications).toHaveBeenCalledWith([message.type_object_id], true);
    expect(container.querySelector('#bugListItemExpansionbug').style.display).toBe('none');
  });

  it('marks only this bug read inside a critical-bug notification rollup', async () => {
    const rollup = {
      market_id: 'workspace', type: 'UNASSIGNED', type_object_id: 'UNASSIGNED_view',
      comment_list: [bug.id, 'other-bug'], highlighted_list: [bug.id, 'other-bug'], is_highlighted: true,
    };
    const button = renderBugs([rollup]);
    await act(async () => button.click());

    expect(currentMessagesState.messages[0].highlighted_list).toEqual(['other-bug']);
    expect(currentMessagesState.messages[0].is_highlighted).toBe(true);
    expect(currentMessagesState.messages[0].comment_list).toEqual([bug.id, 'other-bug']);
    expect(currentMessagesState.pendingClears).toEqual([
      { marketId: 'workspace', typeObjectId: 'UNASSIGNED_bug', event: 'dehighlight' },
    ]);
    expect(removeNotifications).not.toHaveBeenCalled();
    expect(container.querySelector('#bugListItemExpansionbug').style.display).toBe('none');
  });
});
