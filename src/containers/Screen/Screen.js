import React, { useContext, useEffect } from 'react'
import _ from 'lodash'
import PropTypes from 'prop-types'
import { useMediaQuery, useTheme } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { useHistory, useLocation } from 'react-router'
import Header from '../Header'
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext'
import {
  decomposeMarketPath,
  formMarketLink,
  navigate,
  preventDefaultAndProp
} from '../../utils/marketIdPathFunctions'
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
  PLANNING_TYPE,
  SUPPORT_SUB_TYPE
} from '../../constants/markets';
import { getNotHiddenMarketDetailsForUser } from '../../contexts/MarketsContext/marketsContextHelper';
import queryString from 'query-string'
import { AccountContext } from '../../contexts/AccountContext/AccountContext'
import { DIALOG_OUTSET_STATE_HACK } from '../../pages/Dialog/Planning/DialogOutset';
import { GroupMembersContext } from '../../contexts/GroupMembersContext/GroupMembersContext';
import { getGroupPresences, getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import OnboardingBanner from '../../components/Banners/OnboardingBanner';
import { OnboardingState, userIsLoaded } from '../../contexts/AccountContext/accountUserContextHelper';
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';

const useStyles = makeStyles((theme) => ({
  hidden: {
    display: 'none',
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
    overflowX: 'hidden',
    willChange: 'scroll-position',
  },
  container: {
    padding: '46px 20px',
    overflowX: 'hidden',
    willChange: 'scroll-position',
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
    willChange: 'scroll-position',
  },
  containerAllLeftPad: {
    padding: '10px 20px 0px 24px',
    overflowX: 'hidden',
    marginTop: '65px',
    width: '100%',
    [theme.breakpoints.down('md')]: {
      padding: '24px 12px 156px',
    },
    willChange: 'scroll-position',
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
    backgroundColor: '#e5edee',
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
  const { marketId: hashMarketId, investibleId: hashInvestibleId, type } = hashValues || {};
  const [messagesState] = useContext(NotificationsContext);
  const [searchResults] = useContext(SearchResultsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [groupsState] = useContext(MarketGroupsContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const [marketsState] = useContext(MarketsContext);
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
    loadingMessageId
  } = props;
  const usedBanner = banner ?? (userState?.user?.onboarding_state === OnboardingState.DemoCreated ?
    <OnboardingBanner/> : undefined);
  const investibleId = pathInvestibleId || searchInvestibleId || hashInvestibleId;
  let pathMarketId = undefined;
  if (action === 'inbox') {
    const message = messagesState?.messages?.find((message) => message.type_object_id === pathMarketIdRaw &&
      !message.deleted);
    pathMarketId = message?.market_id;
  } else if (action === 'dialog') {
    pathMarketId = pathMarketIdRaw;
  }
  const marketId = pathMarketId || searchMarketId || hashMarketId ||
    getPlanningMarketId(investibleId, marketsState, investiblesState);
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
  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(marketsState, marketPresencesState);
  let markets = [];
  if (myNotHiddenMarketsState.marketDetails) {
    const filtered = myNotHiddenMarketsState.marketDetails.filter((market) =>
      market.market_type === PLANNING_TYPE);
    markets = _.sortBy(filtered, (market) => market.market_sub_type === SUPPORT_SUB_TYPE, 'name');
  }
  const defaultMarket = getFirstWorkspace(markets, marketId) || {};
  const reallyAmLoading = !hidden && appEnabled && (loading || !userIsLoaded(userState));
  if ((hidden && !isInbox)||(marketId && _.isEmpty(defaultMarket))) {
    return <React.Fragment/>
  }

  function setMarketIdFull(newMarketId) {
    setCurrentWorkspace(newMarketId);
    navigate(history, formMarketLink(newMarketId, newMarketId));
  }

  if (marketId && defaultMarket.id !== marketId) {
    // Handle they are on banned market
    setMarketIdFull(defaultMarket.id);
  }

  const useGroupId = groupId ? groupId : (investibleId ?
    getGroupForInvestibleId(investibleId, defaultMarket.id, investiblesState) :
    (pathname === '/' ? defaultMarket.id : undefined));
  const navListItemTextArray = [];
  const inactiveGroups = [];
  if (!_.isEmpty(defaultMarket) && !_.isEmpty(groupsState[defaultMarket.id])) {
    const { onGroupClick, useHoverFunctions, resetFunction } = navigationOptions || {};
    const itemsSorted = _.sortBy(groupsState[defaultMarket.id], 'name');
    const marketPresences = getMarketPresences(marketPresencesState, defaultMarket.id) || [];
    const myPresence = marketPresences.find((presence) => presence.current_user) || {};
    const itemsRaw = itemsSorted.map((group) => {
      const groupPresences = getGroupPresences(marketPresences, groupPresencesState, defaultMarket.id,
        group.id) || [];
      const isChosen = group.id === useGroupId;
      if (_.isEmpty(groupPresences)) {
        inactiveGroups.push(group);
        if (!isChosen) {
          return {};
        }
      }
      const myIcon = groupPresences.find((presence) => presence.id === myPresence.id) ?
        Group : GroupOutlined;
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
            navigate(history, formMarketLink(defaultMarket.id, group.id));
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
  const inboxCount = getInboxCount(messagesState);
  const composeChosen = action === 'wizard' && type === COMPOSE_WIZARD_TYPE.toLowerCase();
  const addCollaboratorChosen = action === 'wizard' && type === ADD_COLLABORATOR_WIZARD_TYPE.toLowerCase();
  const navigationMenu =
    {
      headerItemTextArray: [
        {icon: Inbox, text: intl.formatMessage({ id: 'inbox' }), target: getInboxTarget(),
          isBold: action?.includes('inbox'), isBlue: pathname === getInboxTarget(),
          iconColor: inboxCount > 0 ? '#E85757' : undefined,
          num: _.isEmpty(search) ? inboxCount : undefined}
      ],
      navMenu: <WorkspaceMenu markets={markets} defaultMarket={defaultMarket} setChosenMarketId={setMarketIdFull}
                              inactiveGroups={inactiveGroups} chosenGroup={useGroupId}/>,
      navListItemTextArray: !_.isEmpty(defaultMarket) ? [
        {
          icon: EditOutlinedIcon, text: intl.formatMessage({ id: 'compose' }),
          isBold: composeChosen, isBlue: composeChosen,
          target: `/wizard#type=${COMPOSE_WIZARD_TYPE.toLowerCase()}&marketId=${defaultMarket.id}`
        },
        {
          icon: AddIcon, text: intl.formatMessage({ id: 'dialogAddParticipantsLabel' }),
          isBold: addCollaboratorChosen, isBlue: addCollaboratorChosen,
          target: `/wizard#type=${ADD_COLLABORATOR_WIZARD_TYPE.toLowerCase()}&marketId=${defaultMarket.id}`
        }
      ] : null}
  ;
  if (navigationMenu.navListItemTextArray) {
    navigationMenu.navListItemTextArray = navigationMenu.navListItemTextArray.concat(navListItemTextArray);
  }
  const myContainerClass = !mobileLayout ? classes.containerAllLeftPad : classes.containerAll;
  const contentClass = mobileLayout ? classes.contentNoStyle : classes.content;
  const sideNavigationContents = <Sidebar navigationOptions={navigationMenu} search={search} title={title}
                                          classes={classes} />;
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
        />
      )}
      {!mobileLayout && !hidden && (
        <div className={classes.paper}>
          <Sidebar navigationOptions={navigationMenu} search={search} title={title} classes={classes} />
        </div>
      )}

      <div className={contentClass}>
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
