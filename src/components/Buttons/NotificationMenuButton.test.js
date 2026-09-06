import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import { IntlProvider } from 'react-intl';
import { getMarketClient } from '../../api/marketLogin';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import { removeWorkListItem } from '../../pages/Home/YourWork/WorkListItem';
import NotificationMenuButton from './NotificationMenuButton';

jest.mock('../../api/marketLogin', () => ({ getMarketClient: jest.fn() }));
jest.mock('../../api/homeAccount', () => ({ getAccountClient: jest.fn() }));
jest.mock('../../utils/userMessage', () => ({ toastErrorAndThrow: jest.fn() }));
jest.mock('../../pages/Home/YourWork/WorkListItem', () => ({ removeWorkListItem: jest.fn() }));
jest.mock('../../contexts/NotificationsContext/NotificationsContext', () => ({
  NotificationsContext: require('react').createContext(),
}));
jest.mock('../../contexts/NotificationsContext/notificationsContextHelper', () => ({
  dehighlightMessage: jest.fn(),
}));
jest.mock('../../contexts/NotificationsContext/notificationsContextReducer', () => ({
  addNavigation: jest.fn(),
  dehighlightMessages: (messages) => ({ type: 'DEHIGHLIGHT_MESSAGES', messages, isPromise: false }),
}));
jest.mock('../../utils/marketIdPathFunctions', () => ({
  formInboxItemLink: jest.fn(),
  getCanonicalNavigationUrl: jest.fn(),
  navigate: jest.fn(),
  preventDefaultAndProp: (event) => {
    event.preventDefault();
    event.stopPropagation();
  },
}));

describe('NotificationMenuButton', () => {
  let container;
  let root;
  let messagesDispatch;
  let removeNotifications;
  const previousActEnvironment = window.IS_REACT_ACT_ENVIRONMENT;
  const protectedMessage = {
    market_id: 'market-id',
    type_object_id: 'REVIEW_REQUIRED_job-id',
    alert_type: 'REQUIRED_APPROVER',
    is_highlighted: true,
  };

  beforeAll(() => {
    window.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterAll(() => {
    window.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
  });

  beforeEach(() => {
    jest.useFakeTimers();
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
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  function renderMenu(message, clearOnly = false) {
    act(() => root.render(
      <MemoryRouter>
        <IntlProvider locale="en" messages={{
          messagePresentCommentChoice: 'Notification actions',
          notificationGoTo: 'Go to notification',
          notificationClear: 'Clear notification',
          markRead: 'Mark read',
        }}>
          <NotificationsContext.Provider value={[{ navigations: [] }, messagesDispatch]}>
            <NotificationMenuButton message={message} clearOnly={clearOnly} />
          </NotificationsContext.Provider>
        </IntlProvider>
      </MemoryRouter>
    ));
  }

  function openMenu() {
    const bell = container.querySelector('button');
    // Material UI requires a visible anchor; jsdom does not calculate layout.
    bell.getBoundingClientRect = () => ({ top: 0, left: 0, bottom: 24, right: 24, width: 24, height: 24 });
    act(() => {
      jest.runOnlyPendingTimers();
      bell.click();
    });
  }

  function menuItem(label) {
    return Array.from(document.querySelectorAll('[role="menuitem"]'))
      .find((item) => item.textContent === label);
  }

  it('marks a highlighted protected notification read, then retains a disabled Mark read action', async () => {
    renderMenu(protectedMessage);
    openMenu();

    const markRead = menuItem('Mark read');
    expect(markRead).toBeDefined();
    expect(markRead.getAttribute('aria-disabled')).not.toBe('true');
    expect(menuItem('Clear notification')).toBeUndefined();
    await act(async () => markRead.click());

    expect(messagesDispatch).toHaveBeenCalledWith({
      type: 'DEHIGHLIGHT_MESSAGES',
      messages: [protectedMessage.type_object_id],
      isPromise: false,
    });
    expect(removeWorkListItem).not.toHaveBeenCalled();

    renderMenu({ ...protectedMessage, is_highlighted: false });
    openMenu();
    expect(menuItem('Mark read').getAttribute('aria-disabled')).toBe('true');
  });

  it('keeps Mark read visible and disabled for an already-read protected inbox notification', () => {
    renderMenu({ ...protectedMessage, is_highlighted: false }, true);
    openMenu();

    const markRead = menuItem('Mark read');
    expect(markRead).toBeDefined();
    expect(markRead.getAttribute('aria-disabled')).toBe('true');
    expect(menuItem('Go to notification')).toBeUndefined();
    expect(menuItem('Clear notification')).toBeUndefined();
  });

  it.each([
    ['ordinary unread', { type_object_id: 'UNREAD_REPLY_comment-id' }, false],
    ['AI-generated persistent', { alert_type: 'AI_GENERATED' }, true],
  ])('keeps Clear notification enabled for an unhighlighted %s notification', async (_name, attributes, forceDelete) => {
    const message = { ...protectedMessage, ...attributes, is_highlighted: false };
    renderMenu(message);
    openMenu();

    const clear = menuItem('Clear notification');
    expect(clear).toBeDefined();
    expect(clear.getAttribute('aria-disabled')).not.toBe('true');
    expect(menuItem('Mark read')).toBeUndefined();
    await act(async () => clear.click());

    expect(removeWorkListItem).toHaveBeenCalledWith(message, messagesDispatch, undefined, forceDelete);
    expect(removeNotifications).toHaveBeenCalledWith([message.type_object_id], true);
    expect(messagesDispatch).not.toHaveBeenCalled();
  });
});
