import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from '@material-ui/core/styles';
import { MemoryRouter } from 'react-router';
import { GmailTabItem, GmailTabs } from '../containers/Tab/Inbox';
import { defaultTheme } from '../config/themes';
import { SwimlaneOpenChip, firstDisplayedOpenItem } from '../pages/Dialog/Planning/swimlaneOpenChip';
import { TODO_TYPE } from '../constants/comments';
import { pickNextMessageInSet } from './notificationNavigation';
import { firstDisplayedCriticalBug } from './openChipNotification';
import { formCommentLink, navigate } from './marketIdPathFunctions';

jest.mock('./marketIdPathFunctions', () => {
  const actual = jest.requireActual('./marketIdPathFunctions');
  return { ...actual, navigate: jest.fn() };
});

const older = {
  type: 'UNREAD_COMMENT',
  type_object_id: 'UNREAD_COMMENT_older',
  comment_id: 'older',
  market_id: 'workspace',
  group_id: 'view',
  updated_at: '2026-09-01T00:00:00Z',
  is_highlighted: true,
};
const newer = {
  type: 'UNREAD_COMMENT',
  type_object_id: 'UNREAD_COMMENT_newer',
  comment_id: 'newer',
  market_id: 'workspace',
  group_id: 'view',
  updated_at: '2026-09-02T00:00:00Z',
  is_highlighted: true,
};

describe('pickNextMessageInSet', () => {
  it('opens the newer notification, the one Next message would open next', () => {
    const chosen = pickNextMessageInSet([older, newer], {}, {}, {}, undefined, '/somewhere-else');
    expect(chosen.type_object_id).toBe(newer.type_object_id);
  });

  it('skips the notification you are already on', () => {
    const chosen = pickNextMessageInSet([older, newer], {}, {}, {}, undefined, '/inbox/UNREAD_COMMENT_newer');
    expect(chosen.type_object_id).toBe(older.type_object_id);
  });
});

describe('new chip click', () => {
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
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('opens the Next message choice and does not switch the tab', () => {
    const onChange = jest.fn();
    const opened = jest.fn();
    act(() => root.render(
      <ThemeProvider theme={defaultTheme}>
        <IntlProvider locale="en" messages={{ notificationGoTo: 'Go to notification' }}>
          <GmailTabs value={0} onChange={onChange}>
            <GmailTabItem label="Jobs" tag="2" tagLabel="new"
              onTagClick={() => opened(pickNextMessageInSet([older, newer], {}, {}, {}, undefined, '/other'))} />
            <GmailTabItem label="Backlog" />
          </GmailTabs>
        </IntlProvider>
      </ThemeProvider>
    ));

    const chip = Array.from(container.querySelectorAll('.MuiTabItem-tag'))
      .find((node) => node.textContent.includes('new'));
    expect(chip).toBeDefined();
    act(() => chip.click());

    expect(opened).toHaveBeenCalledWith(expect.objectContaining({ type_object_id: newer.type_object_id }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('opens the first Immediate bug and does not switch the tab', () => {
    const quiet = { id: 'quiet', market_id: 'workspace', group_id: 'view', updated_at: '2026-09-03T00:00:00Z' };
    const noisy = { id: 'noisy', market_id: 'workspace', group_id: 'view', updated_at: '2026-09-01T00:00:00Z' };
    const messages = [
      { comment_id: 'noisy', is_highlighted: true },
      { comment_id: 'noisy', is_highlighted: true },
    ];
    const onChange = jest.fn();
    const opened = jest.fn();
    act(() => root.render(
      <ThemeProvider theme={defaultTheme}>
        <IntlProvider locale="en" messages={{ notificationGoToBug: 'Go to bug' }}>
          <GmailTabs value={0} onChange={onChange}>
            <GmailTabItem label="Bugs" tag="2" tagLabel="critical" tagTooltipId="notificationGoToBug"
              onTagClick={() => opened(firstDisplayedCriticalBug([quiet, noisy], messages))} />
            <GmailTabItem label="Jobs" />
          </GmailTabs>
        </IntlProvider>
      </ThemeProvider>
    ));

    const chip = Array.from(container.querySelectorAll('.MuiTabItem-tag'))
      .find((node) => node.textContent.includes('critical'));
    expect(chip).toBeDefined();
    act(() => chip.click());

    expect(opened).toHaveBeenCalledWith(expect.objectContaining({ id: 'noisy' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('open chip click', () => {
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
    navigate.mockClear();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('opens the first task and does not open the job', () => {
    const inProgress = {
      id: 'task-progress', investible_id: 'job', comment_type: TODO_TYPE, in_progress: true,
      market_id: 'workspace', group_id: 'view', updated_at: '2026-09-01T00:00:00Z',
    };
    const newerTask = {
      id: 'task-newer', investible_id: 'job', comment_type: TODO_TYPE,
      market_id: 'workspace', group_id: 'view', updated_at: '2026-09-03T00:00:00Z',
    };
    const target = firstDisplayedOpenItem([inProgress, newerTask], 'job', [TODO_TYPE], 'tasks',
      { searchResults: { results: [], parentResults: [], search: '' } });
    const openJob = jest.fn();
    act(() => root.render(
      <ThemeProvider theme={defaultTheme}>
        <IntlProvider locale="en" messages={{ open: 'open', notificationGoToTask: 'Go to task' }}>
          <MemoryRouter>
            <div onClick={openJob}>
              <SwimlaneOpenChip labelNum={2} target={target} />
            </div>
          </MemoryRouter>
        </IntlProvider>
      </ThemeProvider>
    ));

    const chip = Array.from(container.querySelectorAll('.MuiTabItem-tag'))
      .find((node) => node.textContent.includes('open'));
    expect(chip).toBeDefined();
    act(() => chip.click());

    expect(target.id).toBe('task-progress');
    expect(navigate).toHaveBeenCalledWith(expect.anything(),
      formCommentLink('workspace', 'view', 'job', 'task-progress'));
    expect(openJob).not.toHaveBeenCalled();
  });
});
