import { useIntl } from 'react-intl'
import Screen from '../../../containers/Screen/Screen'
import PropTypes from 'prop-types'
import Inbox from './Inbox'
import React, { useContext, useReducer } from 'react'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import {
  getNotHiddenMarketDetailsForUser,
  marketTokenLoaded
} from '../../../contexts/MarketsContext/marketsContextHelper'
import { useHistory } from 'react-router'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import { pushMessage } from '../../../utils/MessageBusUtils';
import queryString from 'query-string'
import { INVITE_MARKET_EVENT, LOAD_MARKET_CHANNEL } from '../../../contexts/MarketsContext/marketsContextMessages'
import { userIsLoaded } from '../../../contexts/AccountContext/accountUserContextHelper'
import { AccountContext } from '../../../contexts/AccountContext/AccountContext'
import { getMessages } from './InboxContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import getReducer from './InboxContext'
import { getOutboxMessages } from './InboxExpansionPanel'
import { isInInbox } from '../../../contexts/NotificationsContext/notificationsContextHelper'
import { SearchResultsContext } from '../../../contexts/SearchResultsContext/SearchResultsContext'
import { decomposeMarketPath } from '../../../utils/marketIdPathFunctions';

function InboxFull(props) {
  const { hidden } = props;
  const intl = useIntl();
  const history = useHistory();
  const { location } = history;
  const { search: querySearch, pathname } = location;
  const { marketId: workItemId } = decomposeMarketPath(pathname);
  const values = queryString.parse(querySearch || '');
  const { fromInvite } = values || {};
  const [marketsState, , tokensHash] = useContext(MarketsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [commentsState] = useContext(CommentsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [messagesState] = useContext(NotificationsContext);
  const [userState] = useContext(AccountContext);
  const [searchResults] = useContext(SearchResultsContext);
  const hasUser = userIsLoaded(userState);
  const { messages: messagesUnsafe } = messagesState;
  const messagesMapped = (messagesUnsafe || []).map((message) => {
    return {...message, id: message.type_object_id};
  });
  const messagesFull = messagesMapped.filter((message) => {
    return isInInbox(message);
  });
  const allOutBoxMessagesOrdered = getOutboxMessages({messagesState, marketsState, marketPresencesState,
    investiblesState, marketStagesState, commentsState, intl});
  const messagesHash = getMessages(allOutBoxMessagesOrdered, messagesFull, searchResults);
  const [inboxState, inboxDispatch] = useReducer(getReducer(messagesHash),
    {page: 1, tabIndex: 0, expansionState: {}, pageState: {}, defaultPage: 1});
  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(marketsState, marketPresencesState);
  if (fromInvite && fromInvite !== 'loaded') {
    pushMessage(LOAD_MARKET_CHANNEL, { event: INVITE_MARKET_EVENT, marketToken: fromInvite });
  }
  let loading = marketsState.initializing || messagesState.initializing || (fromInvite && !hasUser);
  if (!loading && myNotHiddenMarketsState.marketDetails) {
    myNotHiddenMarketsState.marketDetails.forEach((market) => {
      if (!marketTokenLoaded(market.id, tokensHash)) {
        // Cannot allow Quill to try to display a picture without a market token
        loading = true;
      }
    });
  }
  if (loading) {
    return (
      <Screen
        hidden={hidden}
        loading={loading}
        title={intl.formatMessage({ id: 'loadingMessage' })}
      >
        <div />
      </Screen>
    );
  }

  return (
    <Screen
      title={intl.formatMessage({id: 'inbox'})}
      tabTitle={intl.formatMessage({id: 'inbox'})}
      hidden={hidden}
      isInbox
    >
      <Inbox inboxState={inboxState} inboxDispatch={inboxDispatch} loadingFromInvite={fromInvite}
             workItemId={workItemId} messagesHash={messagesHash} messagesFull={messagesFull}
             searchResults={searchResults}
      />
    </Screen>
  );
}

InboxFull.propTypes = {
  hidden: PropTypes.bool.isRequired
}

export default InboxFull;