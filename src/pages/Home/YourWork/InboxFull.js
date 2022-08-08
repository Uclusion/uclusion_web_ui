import { FormattedMessage, useIntl } from 'react-intl'
import Screen from '../../../containers/Screen/Screen'
import PropTypes from 'prop-types'
import Inbox from './Inbox'
import React, { useContext, useReducer, useState } from 'react'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext'
import {
  getNotHiddenMarketDetailsForUser,
  marketTokenLoaded
} from '../../../contexts/MarketsContext/marketsContextHelper'
import _ from 'lodash'
import { formMarketLink, navigate, preventDefaultAndProp } from '../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import AddIcon from '@material-ui/icons/Add'
import { PLANNING_TYPE } from '../../../constants/markets'
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
import WorkspaceMenu from '../WorkspaceMenu'
import { Group } from '@material-ui/icons'
import { Button } from '@material-ui/core'
import { Dialog } from '../../../components/Dialogs'
import { useLockedDialogStyles } from '../../Dialog/DialogBodyEdit'
import AddNewUsers from '../../Dialog/UserManagement/AddNewUsers'
import MarketCreate from '../../Dialog/Planning/MarketCreate'
import MarketCreateActions from '../../Dialog/Planning/MarketCreateActions'

function InboxFull(props) {
  const { hidden } = props;
  const intl = useIntl();
  const history = useHistory();
  const { location } = history;
  const { search: querySearch } = location;
  const values = queryString.parse(querySearch || '');
  const { fromInvite } = values || {};
  const [page, setPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  //TODO need to store chosen market on disk
  const [chosenMarketId, setChosenMarketId] = useState(null);
  const [marketsState, , tokensHash] = useContext(MarketsContext);
  const [groupsState] = useContext(MarketGroupsContext);
  const [searchResults] = useContext(SearchResultsContext);
  const { results, parentResults, search } = searchResults;
  const [messagesState] = useContext(NotificationsContext);
  const [userState] = useContext(AccountUserContext);
  const hasUser = userIsLoaded(userState);
  const lockedDialogClasses = useLockedDialogStyles();
  const autoFocusRef = React.useRef(null);
  const [open, setOpen] = React.useState(false);
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
  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(marketsState);
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
  let markets = [];
  if (myNotHiddenMarketsState.marketDetails) {
    const filtered = myNotHiddenMarketsState.marketDetails.filter((market) => market.market_type === PLANNING_TYPE &&
      !['SUPPORT'].includes(market.market_sub_type));
    markets = _.sortBy(filtered, 'name');
  }
  let defaultMarket;
  if (!_.isEmpty(markets)) {
    if (_.isEmpty(chosenMarketId)) {
      defaultMarket = markets[0];
    } else {
      defaultMarket = markets.find((market) => market.id === chosenMarketId);
    }
  }
  const navigationMenu = {
    navMenu: <WorkspaceMenu markets={markets} defaultMarket={defaultMarket} setChosenMarketId={setChosenMarketId}
    setOpen={setOpen}/>,
    navListItemTextArray: [
      {
        icon: AddIcon, text: intl.formatMessage({ id: 'homeAddGroup' }),
        target: `/wizard#type=${PLANNING_TYPE.toLowerCase()}`
      },
    ]};

  if (!_.isEmpty(defaultMarket) && !_.isEmpty(groupsState[defaultMarket.id])) {
    const items = groupsState[defaultMarket.id].map((group) => {
      return {icon: Group, text: group.name,
        onClickFunc: (event) => {
          preventDefaultAndProp(event);
          pushMessage(MODIFY_NOTIFICATIONS_CHANNEL, { event: REMOVE_CURRENT_EVENT });
          navigate(history, formMarketLink(defaultMarket.id, group.id));
        }};
    });
    navigationMenu.navListItemTextArray.push(...items);
  }
  let actions;
  if (open === 'addMarket'){
    actions = <MarketCreateActions setOpen={setOpen} />;
  } else if (open === 'addNewUsers') {
    actions = <Button
      variant="outlined"
      size="small"
      onClick={() => setOpen(false)}
      ref={autoFocusRef}
    >
      <FormattedMessage id="close" />
    </Button>;
  }
  let content;
  if (open === 'addMarket') {
    content = <MarketCreate />;
  } else if (open === 'addNewUsers') {
    content = <AddNewUsers market={defaultMarket} isInbox/>;
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
      <Dialog
        autoFocusRef={autoFocusRef}
        classes={{
          root: lockedDialogClasses.root,
          actions: lockedDialogClasses.actions,
          content: lockedDialogClasses.issueWarningContent,
          title: lockedDialogClasses.title
        }}
        open={open !== false}
        onClose={() => setOpen(false)}
        disableActionClass={open === 'addNewUsers'}
        actions={actions}
        content={content}
      />
    </Screen>
  );
}

InboxFull.propTypes = {
  hidden: PropTypes.bool.isRequired
}

export default InboxFull;