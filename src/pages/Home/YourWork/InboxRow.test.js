import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import InboxRow from './InboxRow';

const mockWorkListItem = jest.fn(() => null);
const mockCalculateTitleExpansionPanel = jest.fn(({ item, openExpansion }) => {
  if (openExpansion) {
    item.title = 'ReviewDesignTitle';
    item.expansionPanel = 'design-panel';
  }
});

jest.mock('../../../contexts/CommentsContext/CommentsContext', () => {
  const React = require('react');
  return { CommentsContext: React.createContext() };
});
jest.mock('../../../contexts/InvestibesContext/InvestiblesContext', () => {
  const React = require('react');
  return { InvestiblesContext: React.createContext() };
});
jest.mock('../../../contexts/MarketsContext/MarketsContext', () => {
  const React = require('react');
  return { MarketsContext: React.createContext() };
});
jest.mock('../../../contexts/MarketStagesContext/MarketStagesContext', () => {
  const React = require('react');
  return { MarketStagesContext: React.createContext() };
});
jest.mock('../../../contexts/MarketPresencesContext/MarketPresencesContext', () => {
  const React = require('react');
  return { MarketPresencesContext: React.createContext() };
});
jest.mock('../../../contexts/MarketGroupsContext/MarketGroupsContext', () => {
  const React = require('react');
  return { MarketGroupsContext: React.createContext() };
});
jest.mock('../../../contexts/NotificationsContext/NotificationsContext', () => {
  const React = require('react');
  return { NotificationsContext: React.createContext() };
});
jest.mock('../../../contexts/OperationInProgressContext/OperationInProgressContext', () => {
  const React = require('react');
  return { OperationInProgressContext: React.createContext() };
});
jest.mock('./WorkListItem', () => (props) => mockWorkListItem(props));
jest.mock('./BlockedNotificationPanel', () => () => null);
jest.mock('./InboxExpansionPanel', () => ({
  calculateTitleExpansionPanel: (props) => mockCalculateTitleExpansionPanel(props)
}));
jest.mock('../../../contexts/CommentsContext/commentsContextHelper', () => ({
  getComment: (state, marketId, commentId) =>
    (state[marketId] || []).find((comment) => comment.id === commentId),
  getCommentRoot: (state, marketId, commentId) =>
    (state[marketId] || []).find((comment) => comment.id === commentId),
  isDesignCapsule: (comment) => comment?.comment_type === 'REPORT' &&
    comment.notification_type === 'BLUE' && comment.pinned === true
}));
jest.mock('../../../contexts/InvestibesContext/investiblesContextHelper', () => ({
  getInvestible: () => undefined
}));
jest.mock('../../../contexts/MarketsContext/marketsContextHelper', () => ({
  getMarket: (state, marketId) => (state.marketDetails || []).find((market) => market.id === marketId)
}));
jest.mock('../../../utils/userFunctions', () => ({ getMarketInfo: () => ({}) }));
jest.mock('../../../utils/messageUtils', () => ({
  findMessagesForInvestibleId: () => [],
  titleText: () => 'notification-title'
}));
jest.mock('../../../utils/stringFunctions', () => ({
  stripHTML: (value) => value,
  transformTicketCode: (value) => value
}));
jest.mock('../../../utils/marketIdPathFunctions', () => ({
  formCommentLink: () => '/comment',
  formWizardLink: () => '/wizard',
  navigate: jest.fn(),
  preventDefaultAndProp: jest.fn()
}));
jest.mock('../../../contexts/MarketStagesContext/marketStagesContextHelper', () => ({
  getFullStage: () => ({}),
  getInReviewStage: () => ({})
}));
jest.mock('../../../contexts/NotificationsContext/notificationsContextHelper', () => ({
  getMessageId: (message) => message.type_object_id,
  isInInbox: () => true,
  messageIsSynced: (message, markets, presences, comments) => {
    const comment = (comments[message.comment_market_id || message.market_id] || [])
      .find((candidate) => candidate.id === message.comment_id);
    return Boolean(comment && comment.version >= message.comment_version);
  }
}));
jest.mock('../../../contexts/MarketPresencesContext/marketPresencesHelper', () => ({
  getMarketPresences: () => []
}));
jest.mock('../../../api/users', () => ({ deleteOrDehilightMessages: jest.fn() }));
jest.mock('react-intl', () => ({
  useIntl: () => ({
    formatDate: () => 'date',
    formatMessage: ({ id }) => id
  })
}));
jest.mock('react-router', () => ({ useHistory: () => ({}) }));
jest.mock('@material-ui/core', () => ({
  useMediaQuery: () => false,
  useTheme: () => ({ breakpoints: { down: () => '' } })
}));
jest.mock('@material-ui/icons', () => ({
  Assignment: () => null,
  Block: () => null,
  CalendarToday: () => null,
  Done: () => null,
  PersonAddOutlined: () => null,
  ReportOutlined: () => null,
  Schedule: () => null
}));
jest.mock('@material-ui/icons/DeleteSweep', () => () => null);
jest.mock('@material-ui/icons/DoneAll', () => () => null);
jest.mock('@material-ui/icons/DoneOutline', () => () => null);
jest.mock('@material-ui/icons/ThumbsUpDown', () => () => null);
jest.mock('@material-ui/icons/ContactSupport', () => () => null);
jest.mock('@material-ui/icons/RateReview', () => () => null);
jest.mock('@material-ui/icons/Reply', () => () => null);
jest.mock('@material-ui/icons/ListAlt', () => () => null);
jest.mock('../../../components/CustomChip/Quiz', () => () => null);
jest.mock('../../../components/CustomChip/LightbulbOutlined', () => () => null);
jest.mock('../../../components/CustomChip/Approval', () => () => null);
jest.mock('../../../components/CustomChip/EditNote', () => () => null);

const message = {
  type: 'UNREAD_COMMENT',
  type_object_id: 'UNREAD_COMMENT_capsule-id',
  market_id: 'market-id',
  comment_id: 'capsule-id',
  comment_version: 1,
  link_type: 'INVESTIBLE_COMMENT',
  updated_at: '2026-09-01T12:00:00Z',
  is_highlighted: true
};

function renderInboxRow(commentsState) {
  ReactDOMServer.renderToStaticMarkup(
    <CommentsContext.Provider value={[commentsState]}>
      <InvestiblesContext.Provider value={[{}]}>
        <MarketsContext.Provider value={[{ marketDetails: [{ id: 'market-id', name: 'Workspace' }] }]}>
          <MarketStagesContext.Provider value={[{}]}>
            <MarketPresencesContext.Provider value={[{}]}>
              <MarketGroupsContext.Provider value={[{}]}>
                <NotificationsContext.Provider value={[{ messages: [] }, jest.fn()]}>
                  <OperationInProgressContext.Provider value={[false, jest.fn()]}>
                    <InboxRow message={message} expansionOpen isDeletable={false} />
                  </OperationInProgressContext.Provider>
                </NotificationsContext.Provider>
              </MarketGroupsContext.Provider>
            </MarketPresencesContext.Provider>
          </MarketStagesContext.Provider>
        </MarketsContext.Provider>
      </InvestiblesContext.Provider>
    </CommentsContext.Provider>
  );
  return mockWorkListItem.mock.calls[0][0];
}

describe('InboxRow synchronization guard', () => {
  beforeEach(() => {
    mockWorkListItem.mockClear();
    mockCalculateTitleExpansionPanel.mockClear();
  });

  it('does not open a generic wizard while the notified comment is missing', () => {
    const props = renderInboxRow({});

    expect(props.isNotSynced).toBe(true);
    expect(props.expansionOpen).toBe(false);
    expect(props.expansionPanel).toBeUndefined();
    expect(props.title).toBe('notification-title');
    expect(mockCalculateTitleExpansionPanel).not.toHaveBeenCalled();
  });

  it('opens the intended route once the design capsule is synchronized', () => {
    const capsule = {
      id: 'capsule-id',
      version: 1,
      body: 'Current design',
      comment_type: 'REPORT',
      notification_type: 'BLUE',
      pinned: true
    };
    const props = renderInboxRow({ 'market-id': [capsule] });

    expect(props.isNotSynced).toBe(false);
    expect(props.expansionOpen).toBe(true);
    expect(props.expansionPanel).toBe('design-panel');
    expect(props.title).toBe('ReviewDesignTitle');
    expect(mockCalculateTitleExpansionPanel).toHaveBeenCalledWith(expect.objectContaining({
      openExpansion: true,
      rootComment: capsule
    }));
  });

  it('does not open the wizard for an older copy of the notified comment', () => {
    const props = renderInboxRow({
      'market-id': [{
        id: 'capsule-id',
        version: 0,
        comment_type: 'REPORT',
        notification_type: 'BLUE',
        pinned: true
      }]
    });

    expect(props.isNotSynced).toBe(true);
    expect(props.expansionOpen).toBe(false);
    expect(props.expansionPanel).toBeUndefined();
    expect(mockCalculateTitleExpansionPanel).not.toHaveBeenCalled();
  });
});
