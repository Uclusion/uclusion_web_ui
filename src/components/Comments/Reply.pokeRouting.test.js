import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { GroupMembersContext } from '../../contexts/GroupMembersContext/GroupMembersContext';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import { ScrollContext } from '../../contexts/ScrollContext';
import { WebSocketContext } from '../../contexts/WebSocketContext';
import Reply from './Reply';
import { LocalCommentsContext } from './Comment';

const mockNavigate = jest.fn();

jest.mock('../../utils/marketIdPathFunctions', () => ({
  ...jest.requireActual('../../utils/marketIdPathFunctions'),
  navigate: (...args) => mockNavigate(...args),
}));

jest.mock('./Comment', () => {
  const React = require('react');
  return {
    LocalCommentsContext: React.createContext(null),
    useCommentStyles: () => ({
      compressedComment: 'compressedComment',
      smallGravatar: 'smallGravatar',
    }),
  };
});
jest.mock('../TextEditors/ReadOnlyQuillEditor', () => () => null);
jest.mock('../TextEditors/Utilities/CoreUtils', () => ({
  editorEmpty: (body) => !body,
}));
jest.mock('../TextFields/UseRelativeTime', () => () => null);
jest.mock('../Avatars/Gravatar', () => () => null);
jest.mock('../Buttons/TooltipIconButton', () => {
  const React = require('react');
  return function MockTooltipIconButton(props) {
    return (
      <button
        id={props.id}
        title={props.translationId}
        disabled={props.disabled}
        onClick={props.onClick}
      />
    );
  };
});
jest.mock('../AddNewWizards/Reply/ReplyStep', () => ({
  hasReply: () => false,
}));
jest.mock('../AddNewWizards/TaskInProgress/TaskInProgressWizard', () => ({
  previousInProgress: () => undefined,
}));
jest.mock('../InlineWizard/InlineWizardContext', () => ({
  useInlineWizardLaunch: () => ({}),
}));
jest.mock('../../pages/Dialog/InvesibleCommentLinker', () => () => null);
jest.mock('../../pages/Home/YourWork/NotificationDeletion', () => () => null);
jest.mock('../../pages/Home/YourWork/InboxExpansionPanel', () => ({
  isMyPokableComment: () => false,
}));
jest.mock('../../api/marketLogin', () => ({
  getMarketClient: jest.fn(),
}));
jest.mock('@material-ui/core', () => {
  const React = require('react');
  return {
    ...jest.requireActual('@material-ui/core'),
    Button: ({ children, id, onClick }) => (
      React.createElement('button', { id, onClick }, children)
    ),
    CardActions: ({ children }) => React.createElement('div', null, children),
    CardContent: ({ children }) => React.createElement('div', null, children),
    Typography: ({ children }) => React.createElement('div', null, children),
    useMediaQuery: () => false,
  };
});

const previousActEnvironment = window.IS_REACT_ACT_ENVIRONMENT;
beforeAll(() => {
  window.IS_REACT_ACT_ENVIRONMENT = true;
});
afterAll(() => {
  window.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
});

function replyTree(pokeAI, setOperationRunning, replyProps = {}) {
  const inlineMarketId = 'inline-option-market';
  const root = {
    id: 'option-question',
    created_by: 'ai-user',
    comment_type: 'QUESTION',
    created_at: '2026-07-28T10:00:00Z',
    updated_at: '2026-07-28T10:00:00Z',
  };
  const reply = {
    id: 'option-reply',
    reply_id: root.id,
    root_comment_id: root.id,
    group_id: 'view-id',
    created_by: 'ai-user',
    ticket_code: 'C-2',
    body: '<p>Which tradeoff should we choose?</p>',
    created_at: '2026-07-28T10:01:00Z',
    updated_at: '2026-07-28T10:01:00Z',
    resolved: false,
  };
  const commentsState = { [inlineMarketId]: [root, reply] };
  const presencesState = {
    [inlineMarketId]: [
      { id: 'ai-user', email: '', investments: [] },
      { id: 'human-user', email: 'human@example.com', current_user: true, investments: [] },
    ],
  };
  const noOp = jest.fn();

  return (
    <ThemeProvider theme={createTheme()}>
      <IntlProvider locale="en" messages={{
        issueReplyLabel: 'Reply',
        pokeAI: 'Poke AI',
        pokeAIJobTooltip: 'Send `{command}` to your connected AI terminal.',
      }}>
        <MemoryRouter>
          <WebSocketContext.Provider value={{ pokeAI }}>
            <OperationInProgressContext.Provider value={[false, setOperationRunning]}>
              <ScrollContext.Provider value={[undefined, undefined, noOp]}>
                <NotificationsContext.Provider value={[{ messages: [] }, noOp]}>
                  <CommentsContext.Provider value={[commentsState, noOp]}>
                    <MarketPresencesContext.Provider value={[presencesState, noOp]}>
                      <MarketsContext.Provider value={[{ marketDetails: [] }, noOp]}>
                        <InvestiblesContext.Provider value={[{}, noOp]}>
                          <MarketStagesContext.Provider value={[{}, noOp]}>
                            <GroupMembersContext.Provider value={[{}, noOp]}>
                              <LocalCommentsContext.Provider value={{
                                comments: [root, reply],
                                marketId: inlineMarketId,
                                idPrepend: '',
                                pokeAIMarketId: 'parent-planning-market',
                                pokeAIParentTicketCode: 'Q-all-500',
                              }}>
                                <Reply
                                  comment={reply}
                                  enableEditing
                                  enableActions={false}
                                  isDeletable={false}
                                  {...replyProps}
                                />
                              </LocalCommentsContext.Provider>
                            </GroupMembersContext.Provider>
                          </MarketStagesContext.Provider>
                        </InvestiblesContext.Provider>
                      </MarketsContext.Provider>
                    </MarketPresencesContext.Provider>
                  </CommentsContext.Provider>
                </NotificationsContext.Provider>
              </ScrollContext.Provider>
            </OperationInProgressContext.Provider>
          </WebSocketContext.Provider>
        </MemoryRouter>
      </IntlProvider>
    </ThemeProvider>
  );
}

describe('Reply option Poke AI routing', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('sends the exact compound command through the parent planning market', async () => {
    const pokeAI = jest.fn().mockResolvedValue();
    const setOperationRunning = jest.fn();
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(replyTree(pokeAI, setOperationRunning));
    });
    await act(async () => {
      container.querySelector('#pokeAIoption-reply').click();
    });

    expect(pokeAI).toHaveBeenCalledWith(
      'parent-planning-market',
      'Start C-2 of Q-all-500'
    );
    expect(setOperationRunning).toHaveBeenNthCalledWith(1, 'pokeAIoption-reply');
    expect(setOperationRunning).toHaveBeenLastCalledWith(false);

    await act(async () => root.unmount());
  });

  it('opens a compressed inbox reply from either its card or open icon', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    const toggleCompression = jest.fn();

    await act(async () => {
      root.render(replyTree(jest.fn(), jest.fn(), {
        isInbox: true,
        useCompression: true,
        inboxMessageId: 'option-question',
        toggleCompression,
      }));
    });

    const openButton = container.querySelector('button[title="rowOpenComment"]');
    expect(openButton).not.toBeNull();

    await act(async () => {
      openButton.parentElement.click();
    });
    expect(mockNavigate).toHaveBeenLastCalledWith(
      expect.anything(),
      '/dialog/inline-option-market?groupId=view-id#coption-reply'
    );

    mockNavigate.mockClear();
    await act(async () => {
      openButton.click();
    });
    expect(mockNavigate).toHaveBeenLastCalledWith(
      expect.anything(),
      '/dialog/inline-option-market?groupId=view-id#coption-reply'
    );
    expect(toggleCompression).not.toHaveBeenCalled();

    await act(async () => root.unmount());
  });

  it('shows an open icon on an expanded inbox reply', async () => {
    const container = document.createElement('div');
    const root = createRoot(container);

    await act(async () => {
      root.render(replyTree(jest.fn(), jest.fn(), {
        isInbox: true,
        useCompression: false,
        inboxMessageId: 'option-reply',
      }));
    });

    const openButton = container.querySelector('button[title="rowOpenComment"]');
    expect(openButton).not.toBeNull();

    await act(async () => {
      openButton.click();
    });
    expect(mockNavigate).toHaveBeenLastCalledWith(
      expect.anything(),
      '/dialog/inline-option-market?groupId=view-id#coption-reply'
    );

    await act(async () => root.unmount());
  });
});
