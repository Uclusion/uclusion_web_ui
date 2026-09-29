import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import { ThemeProvider } from '@material-ui/core/styles';
import { GmailTabItem, GmailTabs } from '../containers/Tab/Inbox';
import { defaultTheme } from '../config/themes';
import { pickNextMessageInSet } from './notificationNavigation';

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
});
