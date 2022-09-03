import React, { useContext, useEffect } from 'react'
import _ from 'lodash'
import PropTypes from 'prop-types'
import { Container, Paper, useMediaQuery, useTheme } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { useHistory, useLocation } from 'react-router'
import { AccountUserContext } from '../../contexts/AccountUserContext/AccountUserContext'
import Header from '../Header'
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext'
import {
  decomposeMarketPath,
  formMarketLink,
  makeBreadCrumbs,
  navigate,
  preventDefaultAndProp
} from '../../utils/marketIdPathFunctions'
import LoadingDisplay from '../../components/LoadingDisplay';
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext'
import { getInboxCount, getInboxTarget } from '../../contexts/NotificationsContext/notificationsContextHelper'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import Sidebar from '../../components/Menus/Sidebar'
import AddIcon from '@material-ui/icons/Add'
import { Group, Inbox } from '@material-ui/icons'
import { getFirstGroup, getFirstWorkspace, setCurrentGroup, setCurrentWorkspace } from '../../utils/redirectUtils'
import GroupsNavigation from './GroupsNavigation'
import { MarketGroupsContext } from '../../contexts/MarketGroupsContext/MarketGroupsContext'
import { useIntl } from 'react-intl'
import WorkspaceMenu from '../../pages/Home/WorkspaceMenu'
import { PLANNING_TYPE } from '../../constants/markets'
import { getNotHiddenMarketDetailsForUser } from '../../contexts/MarketsContext/marketsContextHelper'
import queryString from 'query-string'

const useStyles = makeStyles((theme) => ({
  hidden: {
    display: 'none',
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
  },
  container: {
    padding: '46px 20px 156px',
  },
  containerAll: {
    padding: '24px 20px 156px',
    marginTop: '65px',
    width: '100%',
    [theme.breakpoints.down('md')]: {
      padding: '24px 12px 156px',
    },
  },
  containerAllLeftPad: {
    padding: '24px 20px 156px 7px',
    marginTop: '65px',
    width: '100%',
    [theme.breakpoints.down('md')]: {
      padding: '24px 12px 156px',
    },
  },
  bannerContainer: {
    marginTop: '5rem',
    marginBottom: '-4rem',
  },
  listContainer: {
    flex: '0 0 auto',
    height: '100%',
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
    maxHeight: '80%',
    display: 'flex',
    flexDirection: 'column',
    flex: '1 0 auto',
    zIndex: 8,
    position: 'fixed',
    top: '7rem',
    minWidth: '13rem',
    textOverflow: 'ellipsis'
  },
  actionContainer: {
    marginTop: '5rem',
    marginBottom: '-6rem'
  },
  contentNoStyle: {},
  pending: {
    maxWidth: '85%',
    marginLeft: 'auto',
    marginRight: 'auto'
  },
  content: {
    marginLeft: '15rem'
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
  const [userState] = useContext(AccountUserContext);
  const { user: unsafeUser } = userState || {};
  const user = unsafeUser || {};
  const history = useHistory();
  const location = useLocation();
  const { pathname, search: querySearch } = location;
  const { marketId, investibleId } = decomposeMarketPath(pathname);
  const values = queryString.parse(querySearch);
  const { groupId } = values || {};
  const [messagesState] = useContext(NotificationsContext);
  const [searchResults] = useContext(SearchResultsContext);
  const [marketState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [commentsState] = useContext(CommentsContext);
  const [groupsState] = useContext(MarketGroupsContext);
  const [marketsState] = useContext(MarketsContext);
  const { results, search } = searchResults;
  const [open, setOpen] = React.useState(false);
  const {
    breadCrumbs,
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
    hideMenu
  } = props;

  useEffect(() => {
    if (!hidden && !_.isEmpty(tabTitle)) {
      const calcPend = getInboxCount(messagesState, marketState, marketPresencesState, commentsState, investiblesState);
      if (calcPend > 0) {
        document.title = `(${calcPend}) ${tabTitle}`;
      } else {
        document.title = `${tabTitle}`;
      }
    }
  }, [commentsState, hidden, investiblesState, marketPresencesState, marketState, messagesState, tabTitle]);

  const reallyAmLoading = !hidden && appEnabled && (loading || _.isEmpty(user));
  if (hidden && !isInbox) {
    return <React.Fragment/>
  }
  let usedBreadCrumbs = breadCrumbs;
  if (_.isEmpty(breadCrumbs)) {
    usedBreadCrumbs = makeBreadCrumbs(history);
  }

  function setMarketIdFull() {
    return (newMarketId) => {
      setCurrentWorkspace(newMarketId);
      navigate(history, formMarketLink(newMarketId, newMarketId));
    }
  }
  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(marketsState);
  let markets = [];
  if (myNotHiddenMarketsState.marketDetails) {
    const filtered = myNotHiddenMarketsState.marketDetails.filter((market) => market.market_type === PLANNING_TYPE);
    markets = _.sortBy(filtered, 'name');
  }
  const defaultMarket = getFirstWorkspace(markets, marketId);
  const useGroupId = groupId ? groupId : (investibleId ? getFirstGroup(groupsState, defaultMarket.id) : undefined);
  const navigationMenu =
    {
      headerItemTextArray: [
        {icon: Inbox, text: intl.formatMessage({ id: 'inbox' }), target: getInboxTarget(messagesState),
          newPage: true, isBold: _.isEmpty(marketId),
          num: _.isEmpty(search) ?
            getInboxCount(messagesState, marketState, marketPresencesState, commentsState, investiblesState)
            : undefined}
      ],
      navMenu: <WorkspaceMenu markets={markets} defaultMarket={defaultMarket} setChosenMarketId={setMarketIdFull}
                              setOpen={setOpen}/>,
      navListItemTextArray: defaultMarket ? [
        {
          icon: AddIcon, text: intl.formatMessage({ id: 'homeAddGroup' }),
          target: `/wizard#type=${PLANNING_TYPE.toLowerCase()}&marketId=${defaultMarket.id}`
        },
      ] : null}
  ;

  if (!_.isEmpty(defaultMarket) && !_.isEmpty(groupsState[defaultMarket.id])) {
    const { onGroupClick } = navigationOptions || {};
    const items = groupsState[defaultMarket.id].map((group) => {
      const isChosen = group.id === useGroupId;
      let num = undefined;
      if (!_.isEmpty(search)) {
        num = (results || []).filter((item) => item.groupId === group.id);
      }
      return {icon: Group, text: group.name, num, isBold: isChosen, openMenuItems: isChosen ? openMenuItems : undefined,
        onClickFunc: (event) => {
          preventDefaultAndProp(event);
          setCurrentGroup(group.id);
          if (onGroupClick) {
            onGroupClick();
          }
          navigate(history, formMarketLink(defaultMarket.id, group.id));
        }};
    });
    navigationMenu.navListItemTextArray.push(...items);
  }
  const noMenu = hideMenu || _.isEmpty(navigationMenu);
  const myContainerClass = !noMenu && !mobileLayout ? classes.containerAllLeftPad : classes.containerAll;
  const contentClass = mobileLayout || noMenu ? classes.contentNoStyle : classes.content;
  const sideNavigationContents = noMenu ? undefined :
    <Sidebar navigationOptions={navigationMenu} search={search} title={title} classes={classes} />;
  return (
    <div className={hidden ? classes.hidden : classes.root} id="root">
      {!hidden && (
        <Header
          title={title}
          titleIcon={titleIcon}
          breadCrumbs={usedBreadCrumbs}
          toolbarButtons={toolbarButtons}
          hidden={reallyAmLoading}
          appEnabled={appEnabled}
          navMenu={sideNavigationContents}
        />
      )}
      {!noMenu && !mobileLayout && !hidden && (
        <Paper className={classes.paper} elevation={3}
               id="navList">
          {sideNavigationContents}
        </Paper>
      )}
      {banner && !hidden && (
        <Container className={classes.bannerContainer}>
          {banner}
        </Container>
      )}
      {!_.isEmpty(useGroupId) && (
        <GroupsNavigation defaultMarket={defaultMarket} open={open} setOpen={setOpen} />
      )}
      <div className={contentClass}>
        {!reallyAmLoading && (
          <Container className={myContainerClass}
                     maxWidth={!noMenu ? 'xl' : 'lg'}>
            {children}
          </Container>
        )}
        {reallyAmLoading && (
         <LoadingDisplay showMessage messageId="loadingMessage" />
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
  banner: PropTypes.node
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
  banner: undefined
};

export default Screen;
