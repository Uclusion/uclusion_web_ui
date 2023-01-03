import React, { useContext, useEffect } from 'react'
import _ from 'lodash'
import PropTypes from 'prop-types'
import { Container, useMediaQuery, useTheme } from '@material-ui/core'
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
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import Sidebar from '../../components/Menus/Sidebar'
import AddIcon from '@material-ui/icons/Add'
import { Group, Inbox } from '@material-ui/icons'
import {
  getFirstWorkspace,
  getGroupForInvestibleId,
  setCurrentWorkspace
} from '../../utils/redirectUtils';
import { MarketGroupsContext } from '../../contexts/MarketGroupsContext/MarketGroupsContext'
import { useIntl } from 'react-intl'
import WorkspaceMenu from '../../pages/Home/WorkspaceMenu'
import { ADD_COLLABORATOR_WIZARD_TYPE, PLANNING_TYPE } from '../../constants/markets';
import { getNotHiddenMarketDetailsForUser } from '../../contexts/MarketsContext/marketsContextHelper'
import queryString from 'query-string'
import { AccountContext } from '../../contexts/AccountContext/AccountContext'

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
    padding: '10px 20px 156px 24px',
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
  const [userState] = useContext(AccountContext);
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

  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(marketsState);
  let markets = [];
  if (myNotHiddenMarketsState.marketDetails) {
    const filtered = myNotHiddenMarketsState.marketDetails.filter((market) => market.market_type === PLANNING_TYPE);
    markets = _.sortBy(filtered, 'name');
  }
  const defaultMarket = getFirstWorkspace(markets, marketId) || {};
  const reallyAmLoading = !hidden && appEnabled && (loading || _.isEmpty(user));
  if ((hidden && !isInbox)||(marketId && _.isEmpty(defaultMarket))) {
    return <React.Fragment/>
  }

  function setMarketIdFull(newMarketId) {
    setCurrentWorkspace(newMarketId);
    navigate(history, formMarketLink(newMarketId, newMarketId));
  }
  const useGroupId = groupId ? groupId : (investibleId ?
    getGroupForInvestibleId(investibleId, defaultMarket.id, investiblesState) : undefined);
  const navigationMenu =
    {
      headerItemTextArray: [
        {icon: Inbox, text: intl.formatMessage({ id: 'inbox' }), target: getInboxTarget(),
          newPage: true, isBold: _.isEmpty(marketId),
          num: _.isEmpty(search) ?
            getInboxCount(messagesState, marketState, marketPresencesState, commentsState, investiblesState)
            : undefined}
      ],
      navMenu: <WorkspaceMenu markets={markets} defaultMarket={defaultMarket} setChosenMarketId={setMarketIdFull} />,
      navListItemTextArray: !_.isEmpty(defaultMarket) ? [
        {
          icon: AddIcon, text: intl.formatMessage({ id: 'dialogAddParticipantsLabel' }),
          target: `/wizard#type=${ADD_COLLABORATOR_WIZARD_TYPE.toLowerCase()}&marketId=${defaultMarket.id}`
        },
        {
          icon: AddIcon, text: intl.formatMessage({ id: 'homeAddGroup' }),
          target: `/wizard#type=${PLANNING_TYPE.toLowerCase()}&marketId=${defaultMarket.id}`
        }
      ] : null}
  ;

  if (!_.isEmpty(defaultMarket) && !_.isEmpty(groupsState[defaultMarket.id])) {
    const { onGroupClick } = navigationOptions || {};
    const itemsSorted = _.sortBy(groupsState[defaultMarket.id], 'name');
    const items = itemsSorted.map((group) => {
      const isChosen = group.id === useGroupId;
      let num = undefined;
      if (!_.isEmpty(search)) {
        num = (results || []).filter((item) => item.groupId === group.id);
      }
      return {icon: Group, text: group.name, num, isBold: isChosen, openMenuItems: isChosen ? openMenuItems : undefined,
        onClickFunc: (event) => {
          preventDefaultAndProp(event);
          if (onGroupClick) {
            onGroupClick();
          }
          navigate(history, formMarketLink(defaultMarket.id, group.id));
        }};
    });
    navigationMenu.navListItemTextArray.push(...items);
  }
  const myContainerClass = !hideMenu && !mobileLayout ? classes.containerAllLeftPad : classes.containerAll;
  const contentClass = mobileLayout || hideMenu ? classes.contentNoStyle : classes.content;
  const sideNavigationContents = hideMenu ? undefined :
    <Sidebar navigationOptions={navigationMenu} search={search} title={title} classes={classes} />;
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
        />
      )}
      {!hideMenu && !mobileLayout && !hidden && (
        <div className={classes.paper}>
          <Sidebar navigationOptions={navigationMenu} search={search} title={title} classes={classes} />
        </div>
      )}
      {banner && !hidden && (
        <Container className={classes.bannerContainer}>
          {banner}
        </Container>
      )}
      <div className={contentClass}>
        {!reallyAmLoading && (
          <Container className={myContainerClass}
                     maxWidth={!hideMenu ? 'xl' : 'lg'}>
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
