import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import Voting from './Voting';

const mockReply = jest.fn(() => null);

jest.mock('../../../components/Comments/Comment', () => {
  const React = require('react');
  return {
    LocalCommentsContext: React.createContext({}),
  };
});
jest.mock('../../../components/Comments/Reply', () => {
  const React = require('react');
  return function MockReply(props) {
    const { LocalCommentsContext } = require('../../../components/Comments/Comment');
    const routing = React.useContext(LocalCommentsContext);
    mockReply(props, routing);
    return null;
  };
});
jest.mock('../../../utils/votingUtils', () => ({
  useInvestibleVoters: () => [{
    name: 'AI User',
    email: '',
    id: 'ai-user',
    quantity: 5,
    commentId: 'vote-reason',
    updatedAt: '2026-07-28T10:00:00Z',
  }],
}));
jest.mock('../../../components/TextEditors/ReadOnlyQuillEditor', () => () => null);
jest.mock('../../../components/CardType', () => () => null);
jest.mock('../../../components/Expiration/ExpiresDisplay', () => () => null);
jest.mock('../../../components/Avatars/GravatarAndName', () => () => null);
jest.mock('../../../components/Buttons/TooltipIconButton', () => () => null);
jest.mock('../../../components/Buttons/SpinningIconLabelButton', () => () => null);
jest.mock('../../Home/YourWork/NotificationDeletion', () => () => null);
jest.mock('../../../components/AddNewWizards/Reply/ReplyStep', () => ({
  hasReply: () => false,
}));
jest.mock('../../../components/AddNewWizards/Approval/ApprovalWizard', () => ({
  commonQuick: jest.fn(),
}));
jest.mock('../../../components/TextEditors/Utilities/CoreUtils', () => ({
  editorEmpty: (body) => !body,
}));
jest.mock('@material-ui/core', () => {
  const React = require('react');
  return {
    ...jest.requireActual('@material-ui/core'),
    Button: ({ children }) => React.createElement('button', null, children),
    CardActions: ({ children }) => React.createElement('div', null, children),
    CardContent: ({ children }) => React.createElement('div', null, children),
    Typography: ({ children }) => React.createElement('div', null, children),
    useMediaQuery: () => false,
  };
});

describe('Voting option Poke AI routing', () => {
  beforeEach(() => {
    mockReply.mockClear();
  });

  it('places vote replies in a context qualified by the parent planning question', () => {
    const noOp = jest.fn();
    const inlineMarketId = 'inline-option-market';
    const reason = {
      id: 'vote-reason',
      body: '<p>Because this option is best.</p>',
    };
    const reply = {
      id: 'vote-reply',
      reply_id: reason.id,
      ticket_code: 'C-2',
      body: '<p>What about the tradeoff?</p>',
    };
    const tree = (
      <ThemeProvider theme={createTheme()}>
        <IntlProvider locale="en" messages={{
          commentCloseThreadLabel: 'Collapse',
          issueReplyLabel: 'Reply',
        }}>
          <MemoryRouter>
            <CommentsContext.Provider value={[{ [inlineMarketId]: [reason, reply] }, noOp]}>
              <MarketPresencesContext.Provider value={[{}, noOp]}>
                <NotificationsContext.Provider value={[{ messages: [] }, noOp]}>
                  <OperationInProgressContext.Provider value={[false, noOp]}>
                    <Voting
                      investibleId="option-id"
                      marketPresences={[]}
                      investmentReasons={[reason]}
                      market={{ id: inlineMarketId }}
                      yourPresence={{ id: 'human-user' }}
                      useCompression={false}
                      pokeAIMarketId="parent-planning-market"
                      pokeAIParentTicketCode="Q-all-500"
                    />
                  </OperationInProgressContext.Provider>
                </NotificationsContext.Provider>
              </MarketPresencesContext.Provider>
            </CommentsContext.Provider>
          </MemoryRouter>
        </IntlProvider>
      </ThemeProvider>
    );

    ReactDOMServer.renderToStaticMarkup(tree);

    expect(mockReply).toHaveBeenCalledWith(
      expect.objectContaining({ comment: reply }),
      expect.objectContaining({
        marketId: inlineMarketId,
        pokeAIMarketId: 'parent-planning-market',
        pokeAIParentTicketCode: 'Q-all-500',
      })
    );
  });
});
