import React, { useContext, useEffect } from 'react'
import _ from 'lodash'
import PropTypes from 'prop-types'
import { useMediaQuery, useTheme } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { useHistory, useLocation } from 'react-router'
import Header from '../Header'
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext'
import {
  decomposeMarketPath, formCommentLink,
  formMarketLink,
  navigate,
  preventDefaultAndProp
} from '../../utils/marketIdPathFunctions';
import LoadingDisplay from '../../components/LoadingDisplay';
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext'
import { getInboxCount, getInboxTarget } from '../../contexts/NotificationsContext/notificationsContextHelper'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import Sidebar from '../../components/Menus/Sidebar'
import AddIcon from '@material-ui/icons/Add'
import { Group, GroupOutlined, Inbox, MoreVert } from '@material-ui/icons';
import {
  getCurrentWorkspace,
  getFirstWorkspace,
  getGroupForInvestibleId, getPlanningMarketId,
  setCurrentWorkspace
} from '../../utils/redirectUtils';
import { MarketGroupsContext } from '../../contexts/MarketGroupsContext/MarketGroupsContext'
import { useIntl } from 'react-intl'
import WorkspaceMenu from '../../pages/Home/WorkspaceMenu'
import {
  ADD_COLLABORATOR_WIZARD_TYPE,
  COMPOSE_WIZARD_TYPE,
  PLANNING_TYPE
} from '../../constants/markets';
import {
  getMarket,
  getNotHiddenMarketDetailsForUser,
  getSortedMarkets
} from '../../contexts/MarketsContext/marketsContextHelper';
import queryString from 'query-string'
import { AccountContext } from '../../contexts/AccountContext/AccountContext'
import { DIALOG_OUTSET_STATE_HACK } from '../../pages/Dialog/Planning/DialogOutset';
import { GroupMembersContext } from '../../contexts/GroupMembersContext/GroupMembersContext';
import {
  getGroupPresences,
  getMarketPresences,
  isSingleUserMarket
} from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import OnboardingBanner from '../../components/Banners/OnboardingBanner';
import { OnboardingState, userIsLoaded } from '../../contexts/AccountContext/accountUserContextHelper';
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';
import { getComment } from '../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import jwt_decode from 'jwt-decode';
import GridView from '../../components/CustomChip/GridView';

const useStyles = makeStyles((theme) => ({
  hidden: {
    display: 'none',
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
    overflowX: 'hidden'
  },
  container: {
    padding: '46px 20px',
    overflowX: 'hidden'
  },
  containerAll: {
    padding: '24px 20px',
    overflowX: 'hidden',
    marginTop: '65px',
    width: '100%',
    [theme.breakpoints.down('md')]: {
      padding: '24px 12px',
    },
    [theme.breakpoints.down('sm')]: {
      padding: '0px 12px 0px 12px',
    },
  },
  containerAllLeftPad: {
    padding: '10px 20px 0px 24px',
    overflowX: 'hidden',
    marginTop: '65px',
    width: '100%',
    [theme.breakpoints.down('md')]: {
      padding: '24px 12px 156px',
    },
  },
  bannerContainer: {
    position: 'sticky',
    top: 0,
  },
  navListIcon: {
    marginRight: 6,
    height: 16,
    width: 16
  },
  navListItem: {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#e0e0e0'
    }
  },
  navListItemGrouped: {
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#e0e0e0'
    },
    paddingBottom: 0,
    paddingTop: 0
  },
  paper: {
    // See https://github.com/mui-org/material-ui/blob/master/packages/material-ui/src/Drawer/Drawer.js
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    flex: '1 0 auto',
    backgroundColor: '#DFF0F2',
    height: '100%',
    zIndex: 8,
    position: 'fixed',
    top: '4rem',
    minWidth: '16rem',
    textOverflow: 'ellipsis'
  },
  actionContainer: {
    marginTop: '5rem',
    marginBottom: '-6rem'
  },
  contentNoStyle: {
    overflowX: 'hidden'
  },
  pending: {
    maxWidth: '85%',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  content: {
    marginLeft: '15rem',
    overflowX: 'hidden',
    height: 'calc(100vh - 1px)'
  },
  contentSearch: {
    paddingLeft: '33rem'
  },
  disabled: {
    color: theme.palette.text.disabled
  },
  navGroupHeader: {
    fontWeight: 'bold',
    textDecoration: 'underline'
  },
  navGroupGreyed: {
    color: theme.palette.text.disabled,
    textDecoration: 'underline'
  },
  elevated: {
    zIndex: 99,
  },
}));

export function getSidebarGroups(navListItemTextArray, intl, groupsState, marketPresencesState, groupPresencesState,
  history, market, useGroupId, groupId, useHoverFunctions, search, results, openMenuItems, inactiveGroups,
  onGroupClick, pathname, resetFunction) {
  const marketId = market.id;
  const itemsSorted = _.sortBy(groupsState[marketId], 'name');
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const isSingleModeWorkspace = isSingleUserMarket(marketPresences, market);
  const myPresence = marketPresences.find((presence) => presence.current_user) || {};
  const itemsRaw = itemsSorted.map((group) => {
    const groupPresences = getGroupPresences(marketPresences, groupPresencesState, marketId,
      group.id) || [];
    const isChosen = group.id === useGroupId;
    if (_.isEmpty(groupPresences)) {
      inactiveGroups.push(group);
      if (!isChosen) {
        return {};
      }
    }
    const myIcon = isSingleModeWorkspace ? GridView :
      (groupPresences.find((presence) => presence.id === myPresence.id) ? Group : GroupOutlined);
    const outsetAvailable = isChosen && useHoverFunctions;
    let num = undefined;
    if (!_.isEmpty(search)) {
      num = (results || []).filter((item) => item.groupId === group.id);
    }
    return {icon: myIcon, endIcon: outsetAvailable ? MoreVert : undefined, text: group.name, num,
      isBold: isChosen, openMenuItems: isChosen ? openMenuItems : undefined,
      isBlue: groupId === group.id || pathname === '/',
      resetFunction: isChosen ? resetFunction : undefined,
      onClickFunc: (event) => {
        preventDefaultAndProp(event);
        if (onGroupClick) {
          onGroupClick();
        }
        if (outsetAvailable) {
          const dialogOutset = document.getElementById(`dialogOutset`);
          if (dialogOutset) {
            if (DIALOG_OUTSET_STATE_HACK.timerId) {
              clearTimeout(DIALOG_OUTSET_STATE_HACK.timerId);
              DIALOG_OUTSET_STATE_HACK.timerId = undefined;
            }
            dialogOutset.style.display = 'block';
          }
        } else {
          navigate(history, formMarketLink(marketId, group.id));
        }
      },
      onLeaveFunc: () => {
        if (isChosen && useHoverFunctions) {
          const dialogOutset = document.getElementById(`dialogOutset`);
          if (dialogOutset) {
            DIALOG_OUTSET_STATE_HACK.timerId = setTimeout(function () {
              if (DIALOG_OUTSET_STATE_HACK.open !== 1) {
                dialogOutset.style.display = 'none';
              }
            }, 2000);
          }
        }
      }
    }
  });
  const items = itemsRaw.filter((item) => !_.isEmpty(item));
  navListItemTextArray.push({
    text: intl.formatMessage({ id: 'viewInGroup' }),
    tipText: intl.formatMessage({ id: 'viewInGroupTip' })
  });
  navListItemTextArray.push(...items);
}

function Screen(props) {
  const classes = useStyles();
  const theme = useTheme();
  const intl = useIntl();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('md'));
  const [userState] = useContext(AccountContext);
  const history = useHistory();
  const location = useLocation();
  const { pathname, search: querySearch, hash } = location;
  const { action, marketId: pathMarketIdRaw, investibleId: pathInvestibleId } = decomposeMarketPath(pathname);
  const values = queryString.parse(querySearch);
  const { groupId, marketId: searchMarketId, investibleId: searchInvestibleId} = values || {};
  const hashValues = queryString.parse(hash);
  const { marketId: hashMarketId, investibleId: hashInvestibleId, type,
    groupId: hashGroupId, typeObjectId } = hashValues || {};
  const [messagesState] = useContext(NotificationsContext);
  const [searchResults] = useContext(SearchResultsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [groupsState] = useContext(MarketGroupsContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const [marketsState] = useContext(MarketsContext);
  const [commentsState] = useContext(CommentsContext);
  const { results, search } = searchResults;
  const {
    hidden,
    loading,
    title,
    titleIcon,
    children,
    tabTitle,
    toolbarButtons,
    appEnabled,
    banner,
    isInbox,
    openMenuItems,
    navigationOptions,
    showBanner,
    disableSearch,
    loadingMessageId,
    groupLoadId,
    outBoxMessages,
    leftNavAdjust
  } = props;
  useEffect(() => {
    if (!hidden && !_.isEmpty(tabTitle)) {
      const calcPend = getInboxCount(messagesState);
      if (calcPend > 0) {
        document.title = `(${calcPend}) ${tabTitle}`;
      } else {
        document.title = `${tabTitle}`;
      }
    }
  }, [hidden, messagesState, tabTitle]);
  if (hidden && !isInbox) {
    return <React.Fragment/>
  }
  const usedBanner = banner ?? (userState?.user?.onboarding_state === OnboardingState.DemoCreated ?
    <OnboardingBanner/> : undefined);
  const isDemoLoading = _.isEmpty(userState?.user) ||
    OnboardingState.NeedsOnboarding === userState.user.onboarding_state;
  const investibleId = pathInvestibleId || searchInvestibleId || hashInvestibleId;
  let pathMarketId = undefined;
  if (action === 'inbox') {
    const message = messagesState?.messages?.find((message) => message.type_object_id === pathMarketIdRaw &&
      !message.deleted);
    if (message) {
      pathMarketId = message.market_id;
    } else {
      // Outbox
      const outboxMessage = outBoxMessages?.find((message) => message.id === pathMarketIdRaw);
      pathMarketId = outboxMessage?.marketId;
    }
  } else if (['comment', 'dialog'].includes(action)) {
    pathMarketId = pathMarketIdRaw;
  } else if (action === 'invite') {
    const decoded = jwt_decode(pathMarketIdRaw);
    pathMarketId = decoded.id;
  }
  let marketId = pathMarketId || searchMarketId || hashMarketId ||
    getPlanningMarketId(investibleId, marketsState, investiblesState);
  const aMarket = getMarket(marketsState, marketId);
  let useLink;
  if (aMarket && aMarket.market_type !== PLANNING_TYPE) {
    marketId = aMarket.parent_comment_market_id;
    const parentComment = getComment(commentsState, marketId, aMarket.parent_comment_id);
    useLink = formCommentLink(marketId, parentComment.group_id, parentComment.investible_id, parentComment.id);
  }
  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(marketsState, marketPresencesState);
  let markets = [];
  if (myNotHiddenMarketsState.marketDetails) {
    const filtered = myNotHiddenMarketsState.marketDetails.filter((market) =>
      market.market_type === PLANNING_TYPE);
    markets = getSortedMarkets(filtered);
  }
  const defaultMarket = getFirstWorkspace(markets, marketId) || {};
  const reallyAmLoading = !hidden && appEnabled && (loading || !userIsLoaded(userState));
  if (marketId && _.isEmpty(defaultMarket)) {
    return <React.Fragment/>
  }

  function setMarketIdFull(newMarketId) {
    setCurrentWorkspace(newMarketId);
    navigate(history, formMarketLink(newMarketId, newMarketId));
  }
  if (marketId && !hidden) {
    if (action === 'dialog' && defaultMarket.id !== marketId) {
      // Handle they are on banned market
      setMarketIdFull(defaultMarket.id);
    } else if (getCurrentWorkspace() !== marketId) {
      setCurrentWorkspace(marketId);
    }
  }

  const useGroupId = groupId ? groupId : (investibleId ?
    getGroupForInvestibleId(investibleId, defaultMarket.id, investiblesState) :
    (pathname === '/' && !isInbox ? defaultMarket.id : undefined));
  const navListItemTextArray = [];
  const inactiveGroups = [];
  if (!_.isEmpty(defaultMarket) && !_.isEmpty(groupsState[defaultMarket.id])) {
    const { onGroupClick, useHoverFunctions, resetFunction } = navigationOptions || {};
    getSidebarGroups(navListItemTextArray, intl, groupsState, marketPresencesState, groupPresencesState,
      history, defaultMarket, useGroupId, groupId, useHoverFunctions, search, results, openMenuItems, inactiveGroups,
      onGroupClick, pathname, resetFunction);
  }
  const inboxCount = getInboxCount(messagesState);
  const composeChosen = action === 'wizard' && type === COMPOSE_WIZARD_TYPE.toLowerCase();
  const addCollaboratorChosen = action === 'wizard' && type === ADD_COLLABORATOR_WIZARD_TYPE.toLowerCase();
  const isArchivedWorkspace = defaultMarket?.market_stage !== 'Active';
  const navigationMenu = isDemoLoading ? {} :
    {
      headerItemTextArray: [
        {icon: Inbox, text: intl.formatMessage({ id: 'inbox' }), target: getInboxTarget(),
          isBold: action?.includes('inbox') || isInbox, isBlue: pathname === getInboxTarget(),
          iconColor: inboxCount > 0 ? '#E85757' : undefined,
          num: _.isEmpty(search) ? inboxCount : undefined}
      ],
      navMenu: <WorkspaceMenu markets={markets} defaultMarket={defaultMarket} setChosenMarketId={setMarketIdFull}
                              inactiveGroups={inactiveGroups} chosenGroup={useGroupId || hashGroupId}
                              useLink={useLink} typeObjectId={typeObjectId}
                              hashInvestibleId={hashInvestibleId} pathMarketIdRaw={pathMarketIdRaw}
                              pathInvestibleId={pathInvestibleId} action={action} />,
      navListItemTextArray: !_.isEmpty(defaultMarket) && !isArchivedWorkspace ? [
        {
          icon: AddIcon, text: intl.formatMessage({ id: 'dialogAddParticipantsLabel' }),
          isBold: addCollaboratorChosen, isBlue: addCollaboratorChosen,
          target: `/wizard#type=${ADD_COLLABORATOR_WIZARD_TYPE.toLowerCase()}&marketId=${defaultMarket.id}`
        },
        {
          icon: EditOutlinedIcon, text: intl.formatMessage({ id: 'compose' }),
          isBold: composeChosen, isBlue: composeChosen,
          target: `/wizard#type=${COMPOSE_WIZARD_TYPE.toLowerCase()}&marketId=${defaultMarket.id}`
        }
      ] : null}
  ;
  if (navigationMenu.navListItemTextArray && !isArchivedWorkspace) {
    navigationMenu.navListItemTextArray = navigationMenu.navListItemTextArray.concat(navListItemTextArray);
  }
  const myContainerClass = !mobileLayout ? classes.containerAllLeftPad : classes.containerAll;
  const contentClass = mobileLayout ? classes.contentNoStyle : classes.content;
  const sideNavigationContents = <Sidebar navigationOptions={navigationMenu} />;
  const renderBanner = showBanner && usedBanner && !hidden;
  return (
    <div className={hidden ? classes.hidden : classes.root} id="root">
      {!hidden && (
        <Header
          title={title}
          titleIcon={titleIcon}
          toolbarButtons={toolbarButtons}
          hidden={reallyAmLoading}
          appEnabled={appEnabled}
          navMenu={sideNavigationContents}
          disableSearch={disableSearch}
          groupLoadId={groupLoadId}
        />
      )}
      {!mobileLayout && !hidden && (
        <div className={classes.paper}>
          <Sidebar navigationOptions={navigationMenu} />
        </div>
      )}

      <div className={contentClass} style={{maxWidth: leftNavAdjust ? `calc(100vw - ${leftNavAdjust}px)` : undefined}}>
        {!reallyAmLoading && (
          <div className={myContainerClass}>
            {renderBanner && (
              <div className={classes.bannerContainer}>
                {usedBanner}
              </div>
            )}
            <div>
              {children}
            </div>
          </div>
        )}
        {reallyAmLoading && (
         <LoadingDisplay showMessage messageId={loadingMessageId} />
        )}
      </div>
    </div>
  );
}

Screen.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  breadCrumbs: PropTypes.arrayOf(PropTypes.object),
  // eslint-disable-next-line react/forbid-prop-types
  toolbarButtons: PropTypes.arrayOf(PropTypes.any),
  hidden: PropTypes.bool,
  loading: PropTypes.bool,
  title: PropTypes.any,
  titleIcon: PropTypes.any,
  children: PropTypes.any,
  tabTitle: PropTypes.string,
  appEnabled: PropTypes.bool,
  banner: PropTypes.node,
  disableSearch: PropTypes.bool,
  loadingMessageId: PropTypes.string
};

Screen.defaultProps = {
  breadCrumbs: [],
  title: '',
  titleIcon: undefined,
  hidden: false,
  loading: false,
  toolbarButtons: [],
  sidebarActions: [],
  appEnabled: true,
  banner: undefined,
  disableSearch: false,
  loadingMessageId: 'loadingMessage'
};

export default Screen;
