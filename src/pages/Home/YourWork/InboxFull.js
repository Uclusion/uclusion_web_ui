import { useIntl } from 'react-intl'
import Screen from '../../../containers/Screen/Screen'
import PropTypes from 'prop-types'
import Inbox from './Inbox'
import React, { useContext, useMemo, useReducer, useRef } from 'react'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import {
  getNotHiddenMarketDetailsForUser,
  marketTokenLoaded
} from '../../../contexts/MarketsContext/marketsContextHelper'
import { useHistory } from 'react-router'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
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
import _ from 'lodash';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';
import { useInitialSyncComplete } from '../../../api/useInitialSyncComplete';

function InboxFull(props) {
  const { hidden, isInbox } = props;
  // B-all-570: dormant until the sync layer says the initial sync converged - the token
  // gate below opens while data is still chunking, and the isKeptInMemory Screen this
  // renders would otherwise run its full body on every arriving market's tick
  const initialSyncComplete = useInitialSyncComplete('inboxFull');
  const intl = useIntl();
  const history = useHistory();
  const { location } = history;
  const { pathname } = location;
  const { marketId: workItemIdRaw } = decomposeMarketPath(pathname);
  // While hidden the inbox output is invisible, so don't let route changes force recomputes -
  // when it unhides the real path is present and everything derives fresh (J-all-394)
  const workItemId = hidden ? undefined : workItemIdRaw;
  const [marketsState, , tokensHash] = useContext(MarketsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [commentsState] = useContext(CommentsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [messagesState, , notificationsInitialized] = useContext(NotificationsContext);
  const [groupsState] = useContext(MarketGroupsContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const [searchResults] = useContext(SearchResultsContext);
  const { messages: messagesUnsafe } = messagesState;
  // J-all-394: this component stays mounted on every route, so these derivations otherwise
  // rebuild the whole inbox and outbox data set - with fresh array identities - on every
  // context tick even while hidden, re-rendering the Inbox subtree for nothing.
  // B-all-570: while hidden they must cost nothing at all - during initial sync at real
  // workspace volume every arriving market ticks these deps, and recomputing over every
  // message each tick starves the sync itself of CPU, so loading never finishes. The ref
  // serves the last visible result while hidden; unhiding derives fresh.
  const frozenWhileHiddenRef = useRef({ messagesFull: [], outbox: [], messagesHash: {} });
  const messagesFull = useMemo(() => {
    if (hidden || !initialSyncComplete) {
      return frozenWhileHiddenRef.current.messagesFull;
    }
    const messagesMapped = (messagesUnsafe || []).map((message) => {
      return {...message, id: message.type_object_id};
    });
    const computed = messagesMapped.filter((message) => {
      return isInInbox(message);
    });
    frozenWhileHiddenRef.current.messagesFull = computed;
    return computed;
  }, [hidden, initialSyncComplete, messagesUnsafe]);
  const allOutBoxMessagesOrdered = useMemo(() => {
    if (hidden || !initialSyncComplete) {
      return frozenWhileHiddenRef.current.outbox;
    }
    const computed = getOutboxMessages({messagesState, marketsState,
      marketPresencesState, investiblesState, marketStagesState, commentsState, groupPresencesState, intl});
    frozenWhileHiddenRef.current.outbox = computed;
    return computed;
  }, [hidden, initialSyncComplete, messagesState, marketsState, marketPresencesState, investiblesState,
      marketStagesState, commentsState, groupPresencesState, intl]);
  const messagesHash = useMemo(() => {
    if (hidden || !initialSyncComplete) {
      return frozenWhileHiddenRef.current.messagesHash;
    }
    const computed = getMessages(allOutBoxMessagesOrdered, messagesFull,
      searchResults, workItemId, groupsState);
    frozenWhileHiddenRef.current.messagesHash = computed;
    return computed;
  }, [hidden, initialSyncComplete, allOutBoxMessagesOrdered, messagesFull, searchResults, workItemId, groupsState]);
  const [inboxState, inboxDispatch] = useReducer(getReducer(),
    {page: 1, expansionState: {}, pageState: {}, defaultPage: 1});
  const myNotHiddenMarketsState = initialSyncComplete ?
    getNotHiddenMarketDetailsForUser(marketsState, marketPresencesState) : {};
  let loading = !initialSyncComplete || marketsState.initializing || !notificationsInitialized;
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
        loadingMessageId='loadingMessage'
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
      isKeptInMemory
      disableSearch={!_.isEmpty(workItemId)}
      isWizard={!_.isEmpty(workItemId)}
      showBanner
      outBoxMessages={allOutBoxMessagesOrdered}
    >
      <Inbox inboxState={inboxState} inboxDispatch={inboxDispatch} workItemId={workItemId} messagesHash={messagesHash}
             messagesFull={messagesFull} hidden={hidden} tabIndex={isInbox ? 0 : 1}
      />
    </Screen>
  );
}

InboxFull.propTypes = {
  hidden: PropTypes.bool.isRequired
}

export default InboxFull;