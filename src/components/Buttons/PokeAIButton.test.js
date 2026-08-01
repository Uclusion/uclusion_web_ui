import React, { act } from 'react';
import ReactDOMServer from 'react-dom/server';
import { createRoot } from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import { WebSocketContext } from '../../contexts/WebSocketContext';
import {
  ISSUE_TYPE,
  QUESTION_TYPE,
  REPORT_TYPE,
  SUGGEST_CHANGE_TYPE,
  TODO_TYPE,
} from '../../constants/comments';
import PokeAIButton, {
  getPokeAIMessage,
  isPokeAICommentType,
  isPokeAIReplyVisible,
} from './PokeAIButton';

const previousActEnvironment = window.IS_REACT_ACT_ENVIRONMENT;
beforeAll(() => {
  window.IS_REACT_ACT_ENVIRONMENT = true;
});
afterAll(() => {
  window.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
});

jest.mock('./SpinningIconLabelButton', () => {
  const React = require('react');
  return function MockSpinningIconLabelButton(props) {
    const { children, id, onClick, toolTipTitle } = props;
    return <button id={id} aria-label={toolTipTitle} onClick={onClick}>{children}</button>;
  };
});

jest.mock('./TooltipIconButton', () => {
  const React = require('react');
  return function MockTooltipIconButton(props) {
    const { id, onClick, translationId } = props;
    return <button id={id} title={translationId} onClick={onClick} />;
  };
});

function pokeAIButtonTree(props, pokeAI = jest.fn(), setOperationRunning = () => {}) {
  return (
    <IntlProvider locale="en" messages={{
      pokeAI: 'Poke AI',
      pokeAIJobTooltip: 'Send `{command}` to your connected AI terminal.',
    }}>
      <OperationInProgressContext.Provider value={[false, setOperationRunning]}>
        <WebSocketContext.Provider value={{ pokeAI }}>
          <PokeAIButton {...props} />
        </WebSocketContext.Provider>
      </OperationInProgressContext.Provider>
    </IntlProvider>
  );
}

function renderPokeAIButton(props) {
  return ReactDOMServer.renderToString(pokeAIButtonTree(props));
}

describe('getPokeAIMessage', () => {
  it('supports bugs, tasks, questions, and suggestions but not notes', () => {
    expect([
      ISSUE_TYPE,
      TODO_TYPE,
      QUESTION_TYPE,
      SUGGEST_CHANGE_TYPE,
    ].every(isPokeAICommentType)).toBe(true);
    expect(isPokeAICommentType(REPORT_TYPE)).toBe(false);
  });

  it('builds the exact Start command from a canonical ticket code', () => {
    expect(getPokeAIMessage('T-all-2395')).toBe('Start T-all-2395');
  });

  it('decodes URI-encoded ticket codes before building the command', () => {
    expect(getPokeAIMessage('T-all-2395%20copy')).toBe('Start T-all-2395 copy');
  });

  it('scopes an option-local code to its globally resolvable parent question', () => {
    expect(getPokeAIMessage('C-2', 'Q-all-500')).toBe('Start C-2 of Q-all-500');
    expect(getPokeAIMessage('C-2%20copy', 'Q-all-500%20copy'))
      .toBe('Start C-2 copy of Q-all-500 copy');
  });

  it('does not build a command without a ticket code', () => {
    expect(getPokeAIMessage()).toBeUndefined();
  });

  it('renders the labeled job control with its exact command as accessible tooltip text', () => {
    const html = renderPokeAIButton({ marketId: 'market-id', ticketCode: 'J-all-364', id: 'pokeAIJob' });

    expect(html).toContain('Poke AI');
    expect(html).toContain(
      'aria-label="Send `Start J-all-364` to your connected AI terminal."'
    );
    expect(html).toContain('id="pokeAIJob"');
  });

  it('renders the compact header control with the Poke AI tooltip label', () => {
    const html = renderPokeAIButton({
      marketId: 'market-id',
      ticketCode: 'T-all-2395',
      id: 'pokeAIComment',
      iconOnly: true,
    });

    expect(html).toContain('title="pokeAI"');
    expect(html).toContain('id="pokeAIComment"');
  });

  it('pokes AI with the market id and exact Start command', async () => {
    const pokeAI = jest.fn().mockResolvedValue();
    const setOperationRunning = jest.fn();
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(pokeAIButtonTree({
        marketId: 'market-id',
        ticketCode: 'T-all-2395',
        id: 'pokeAIComment',
      }, pokeAI, setOperationRunning));
    });

    await act(async () => {
      container.querySelector('button').click();
    });

    expect(pokeAI).toHaveBeenCalledWith('market-id', 'Start T-all-2395');
    expect(setOperationRunning).toHaveBeenNthCalledWith(1, 'pokeAIComment');
    expect(setOperationRunning).toHaveBeenLastCalledWith(false);
    await act(async () => root.unmount());
  });

  it('routes an option-local compact poke through the parent planning market', async () => {
    const pokeAI = jest.fn().mockResolvedValue();
    const setOperationRunning = jest.fn();
    const container = document.createElement('div');
    const root = createRoot(container);
    await act(async () => {
      root.render(pokeAIButtonTree({
        marketId: 'parent-planning-market',
        ticketCode: 'C-2',
        parentTicketCode: 'Q-all-500',
        id: 'pokeAIOptionReply',
        iconOnly: true,
      }, pokeAI, setOperationRunning));
    });

    await act(async () => {
      container.querySelector('button').click();
    });

    expect(pokeAI).toHaveBeenCalledWith(
      'parent-planning-market',
      'Start C-2 of Q-all-500'
    );
    expect(setOperationRunning).toHaveBeenNthCalledWith(1, 'pokeAIOptionReply');
    expect(setOperationRunning).toHaveBeenLastCalledWith(false);
    await act(async () => root.unmount());
  });
});

describe('isPokeAIReplyVisible', () => {
  it('hides an inline reply while its parent ticket code is unavailable', () => {
    expect(isPokeAIReplyVisible(
      true,
      'parent-planning-market',
      undefined
    )).toBe(false);
  });

  it('keeps globally qualified inline and planning subtasks visible', () => {
    expect(isPokeAIReplyVisible(
      false,
      'parent-planning-market',
      'Q-all-500'
    )).toBe(true);
    expect(isPokeAIReplyVisible(true, undefined, undefined)).toBe(true);
  });

  it('keeps same-market visibility limited to subtasks when a parent code arrives', () => {
    // J-all-380 threads the enclosing job/root into every reply's Start
    // message; that must not widen which replies get the button.
    expect(isPokeAIReplyVisible(false, undefined, 'J-all-1')).toBe(false);
    expect(isPokeAIReplyVisible(true, undefined, 'J-all-1')).toBe(true);
  });
});
