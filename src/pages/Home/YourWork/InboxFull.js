import { useIntl } from 'react-intl'
import Screen from '../../../containers/Screen/Screen'
import PropTypes from 'prop-types'
import Inbox from './Inbox'
import React, { useContext, useReducer, useState } from 'react'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import {
  getHiddenMarketDetailsForUser,
  getNotHiddenMarketDetailsForUser,
  marketTokenLoaded
} from '../../../contexts/MarketsContext/marketsContextHelper'
import _ from 'lodash'
import SettingsIcon from '@material-ui/icons/Settings'
import { formMarketLink, navigate, preventDefaultAndProp } from '../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import AddIcon from '@material-ui/icons/Add'
import { PLANNING_TYPE, UNNAMED_SUB_TYPE } from '../../../constants/markets'
import AgilePlanIcon from '@material-ui/icons/PlaylistAdd'
import { SearchResultsContext } from '../../../contexts/SearchResultsContext/SearchResultsContext'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import { pushMessage } from '../../../utils/MessageBusUtils'
import {
  MODIFY_NOTIFICATIONS_CHANNEL, REMOVE_CURRENT_EVENT
} from '../../../contexts/NotificationsContext/notificationsContextMessages'
import queryString from 'query-string'
import { INVITE_MARKET_EVENT, LOAD_MARKET_CHANNEL } from '../../../contexts/MarketsContext/marketsContextMessages'
import { AccountUserContext } from '../../../contexts/AccountUserContext/AccountUserContext'
import { userIsLoaded } from '../../../contexts/AccountUserContext/accountUserContextHelper'

function InboxFull(props) {
  const { hidden } = props;
  const intl = useIntl();
  const history = useHistory();
  const { location } = history;
  const { search: querySearch } = location;
  const values = queryString.parse(querySearch || '');
  const { fromInvite } = values || {};
  const [showAll, setShowAll] = useState(false);
  const [page, setPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const [marketsState, , tokensHash] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [searchResults] = useContext(SearchResultsContext);
  const { results, parentResults, search } = searchResults;
  const [messagesState] = useContext(NotificationsContext);
  const [userState] = useContext(AccountUserContext);
  const hasUser = userIsLoaded(userState);
  const [expansionPendingState, expansionPendingDispatch] = useReducer((state, action) => {
    const { id, expandedMessages, contractAll } = action;
    let newExpanded = state;
    if (!_.isEmpty(expandedMessages)) {
      newExpanded = { ...state };
      expandedMessages.forEach((message) => {
        newExpanded[message.id] = true;
      });
    } else if (contractAll) {
      newExpanded = {};
    } else if (id !== undefined) {
      if (state[id] === undefined) {
        newExpanded = {...state, [id]: true};
      } else {
        newExpanded = _.omit(state, id);
      }
    }
    return newExpanded;
  }, {});
  const [expansionState, expansionDispatch] = useReducer((state, action) => {
    const { id, expandAll } = action;
    let newExpanded = state;
    if (expandAll !== undefined) {
      if (expandAll) {
        const { messages: messagesUnsafe } = messagesState;
        newExpanded = { ...state };
        if (_.isEmpty(messagesUnsafe)) {
          newExpanded['emptyInbox'] = expandAll;
        } else {
          messagesUnsafe.forEach((message) => {
            newExpanded[message.type_object_id] = expandAll;
          });
        }
      } else {
        newExpanded = {};
      }
    } else if (id !== undefined) {
      if (state[id] === undefined) {
        newExpanded = {...state, [id]: true};
      } else {
        newExpanded = _.omit(state, id);
      }
    }
    return newExpanded;
  }, {});
  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(marketsState, marketPresencesState);
  const hiddenMarketsRaw = getHiddenMarketDetailsForUser(marketsState, marketPresencesState) || [];
  const hiddenMarkets = hiddenMarketsRaw.filter((market) => market.market_type === PLANNING_TYPE);
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

  function showMarketDisabled(marketId, defaultValue) {
    if (_.isEmpty(search)) {
      return defaultValue;
    }

    return !(results.find((result) => result.id === marketId || result.marketId === marketId)
      ||parentResults.includes(marketId));
  }
  const createChannelPath = `/wizard#type=${PLANNING_TYPE.toLowerCase()}`;
  const navigationMenu = {
    navListItemTextArray: [
      {
        icon: AddIcon, text: intl.formatMessage({ id: 'homeAddPlanning' }),
        target: createChannelPath
      },
      {
        icon: AddIcon, text: intl.formatMessage({ id: 'oneDoneInvestible' }),
        target: '/investibleAdd'
      },
      {
        icon: SettingsIcon, text: intl.formatMessage({ id: 'settings' }),
        target: '/notificationPreferences'
      },
    ]};
  if (myNotHiddenMarketsState.marketDetails) {
    const filtered = myNotHiddenMarketsState.marketDetails.filter((market) => market.market_type === PLANNING_TYPE &&
      !['SUPPORT', UNNAMED_SUB_TYPE].includes(market.market_sub_type));
    const sorted = _.sortBy(filtered, 'name');
    const items = sorted.map((market) => {
      return {icon: AgilePlanIcon, text: market.name, isGreyed: showMarketDisabled(market.id, false),
        onClickFunc: (event) => {
          preventDefaultAndProp(event);
          pushMessage(MODIFY_NOTIFICATIONS_CHANNEL, { event: REMOVE_CURRENT_EVENT });
          navigate(history, formMarketLink(market.id));
        }};
    });
    navigationMenu.navListItemTextArray.unshift(...items);
  }
  if (!_.isEmpty(hiddenMarkets)) {
    if (showAll) {
      const sorted = _.sortBy(hiddenMarkets, 'name');
      const items = sorted.map((market) => {
        return {
          icon: AgilePlanIcon, text: market.name,
          isGreyed: showMarketDisabled(market.id, true),
          target: formMarketLink(market.id)
        };
      });
      navigationMenu.navListItemTextArray.push({
        text: intl.formatMessage({ id: 'removeArchive' }),
        onClickFunc: (event) => {
          preventDefaultAndProp(event);
          setShowAll(false);
        }
      });
      navigationMenu.navListItemTextArray = navigationMenu.navListItemTextArray.concat(items);
    } else {
      navigationMenu.navListItemTextArray.push({
        text: intl.formatMessage({ id: 'seeArchives' }),
        onClickFunc: (event) => {
          preventDefaultAndProp(event);
          setShowAll(true);
        }
      });
    }
  }
  return (
    <Screen
      title={intl.formatMessage({id: 'inbox'})}
      tabTitle={intl.formatMessage({id: 'inbox'})}
      hidden={hidden}
      navigationOptions={navigationMenu}
      isInbox
    >
      <Inbox expansionState={expansionState} expansionDispatch={expansionDispatch} page={page} setPage={setPage}
             loadingFromInvite={fromInvite} pendingPage={pendingPage} setPendingPage={setPendingPage}
             expansionPendingState={expansionPendingState} expansionPendingDispatch={expansionPendingDispatch}
      />
    </Screen>
  );
}

InboxFull.propTypes = {
  hidden: PropTypes.bool.isRequired
}

export default InboxFull;