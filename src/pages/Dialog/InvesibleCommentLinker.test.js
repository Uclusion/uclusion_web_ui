import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import messages from '../../config/locales/en';
import InvesibleCommentLinker from './InvesibleCommentLinker';

describe('rendered short-code copy controls', () => {
  let container;
  let root;
  let writeText;
  let clipboardDescriptor;
  let previousActEnvironment;

  beforeEach(() => {
    previousActEnvironment = global.IS_REACT_ACT_ENVIRONMENT;
    global.IS_REACT_ACT_ENVIRONMENT = true;
    clipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    writeText = jest.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    if (clipboardDescriptor) {
      Object.defineProperty(navigator, 'clipboard', clipboardDescriptor);
    } else {
      delete navigator.clipboard;
    }
    global.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
  });

  function renderLinker(ticketCode, props = {}, comments = []) {
    const investibles = {
      job: {
        investible: { id: 'job', name: 'Share a precise reference' },
        market_infos: [{ market_id: 'workspace', ticket_code: ticketCode }],
      },
    };
    act(() => root.render(
      <ThemeProvider theme={createTheme()}>
        <IntlProvider locale="en" messages={messages}>
          <InvestiblesContext.Provider value={[investibles, () => {}]}>
            <CommentsContext.Provider value={[{ workspace: comments }, () => {}]}>
              <InvesibleCommentLinker investibleId="job" marketId="workspace" {...props} />
            </CommentsContext.Provider>
          </InvestiblesContext.Provider>
        </IntlProvider>
      </ThemeProvider>
    ));
  }

  function click(button) {
    expect(button).toBeDefined();
    expect(button).not.toBeNull();
    act(() => button.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  }

  function commitButton(code) {
    return [...container.querySelectorAll('button')].find(button => button.textContent === code);
  }

  it('copies distinct qualified references for O-1 on different questions', () => {
    for (const parentQuestionCode of ['Q-Demo-3', 'Q-Demo-4']) {
      renderLinker('O-1', { parentQuestionCode });
      click(container.querySelector('button[aria-label="Click to copy question and option code"]'));
    }

    expect(writeText.mock.calls).toEqual([
      ['Q-Demo-3_O-1'],
      ['Q-Demo-4_O-1'],
    ]);
  });

  it('suppresses option code copying without a question parent and preserves link copying', () => {
    for (const parentQuestionCode of [undefined, 'J-Demo-3']) {
      renderLinker('O-1', { parentQuestionCode });
      expect(container.querySelector('button[aria-label="Click to copy question and option code"]')).toBeNull();
      expect(container.querySelectorAll('button')).toHaveLength(1);
      click(container.querySelector('button'));
    }

    expect(writeText.mock.calls).toEqual([
      [`${window.location.origin}/workspace/O-1`],
      [`${window.location.origin}/workspace/O-1`],
    ]);
  });

  it('preserves job code, commit-message and link copying', () => {
    renderLinker('J-Demo-42');
    click(container.querySelector('button[aria-label="Click to copy code only"]'));
    click(commitButton('J-42'));
    click(container.querySelector('button'));

    expect(writeText.mock.calls).toEqual([
      ['J-Demo-42'],
      ['J-Demo-42 Share a precise reference'],
      [`${window.location.origin}/workspace/J-Demo-42`],
    ]);
  });

  it('preserves ordinary comment code, commit-message and link copying', () => {
    renderLinker('J-Demo-42', { commentId: 'comment' }, [{
      id: 'comment',
      ticket_code: 'C-Demo-7',
      body: '<p>Explain <strong>this choice</strong>.</p>',
    }]);
    click(container.querySelector('button[aria-label="Click to copy code only"]'));
    click(commitButton('C-7'));
    click(container.querySelector('button'));

    expect(writeText.mock.calls).toEqual([
      ['C-Demo-7'],
      ['C-Demo-7 Explain this choice.'],
      [`${window.location.origin}/workspace/C-Demo-7`],
    ]);
  });
});
