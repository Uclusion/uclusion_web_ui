import React, { useContext, useEffect } from 'react'
import _ from 'lodash'
import PropTypes from 'prop-types'
import { Container, Paper, useMediaQuery, useTheme } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { useHistory } from 'react-router'
import { AccountUserContext } from '../../contexts/AccountUserContext/AccountUserContext'
import Header from '../Header'
import ActionBar from '../ActionBar'
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext'
import { makeBreadCrumbs } from '../../utils/marketIdPathFunctions'
import LoadingDisplay from '../../components/LoadingDisplay';
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext'
import { getInboxCount } from '../../contexts/NotificationsContext/notificationsContextHelper'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import Sidebar from '../../components/Menus/Sidebar'

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
  const mobileLayout = useMediaQuery(theme.breakpoints.down('md'));
  const [userState] = useContext(AccountUserContext);
  const { user: unsafeUser } = userState || {};
  const user = unsafeUser || {};
  const history = useHistory();
  const [messagesState] = useContext(NotificationsContext);
  const [searchResults] = useContext(SearchResultsContext);
  const [marketState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [commentsState] = useContext(CommentsContext);
  const { search } = searchResults;

  const {
    breadCrumbs,
    hidden,
    loading,
    title,
    titleIcon,
    children,
    sidebarActions,
    tabTitle,
    toolbarButtons,
    appEnabled,
    banner,
    navigationOptions,
    isInbox,
    isPending
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
  const myContainerClass = navigationOptions && !mobileLayout ? classes.containerAllLeftPad : classes.containerAll
  const contentClass = mobileLayout ? classes.contentNoStyle : (isPending ? classes.pending :
    navigationOptions ? classes.content : classes.contentNoStyle);
  const { navListItemTextArray, navMenu } = navigationOptions || {};
  const hasMenu = !_.isEmpty(navListItemTextArray) || !_.isEmpty(navMenu);
  const sideNavigationContents = !hasMenu ? undefined : <Sidebar navigationOptions={navigationOptions}
                                                                 search={search} title={title} classes={classes} /> ;
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
          isInbox={isInbox}
          isPending={isPending}
        />
      )}
      {hasMenu && !mobileLayout && !hidden && (
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
      {!_.isEmpty(sidebarActions) && !reallyAmLoading && !hidden && (
        <Container className={classes.actionContainer} id="actionContainer">
          <ActionBar actionBarActions={sidebarActions} appEnabled={appEnabled} />
        </Container>
      )}
      <div className={contentClass}>
        {!reallyAmLoading && (
          <Container className={myContainerClass}
                     maxWidth={isPending ? false : (!_.isEmpty(navListItemTextArray) ? 'xl' : 'lg')}>
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
  sidebarActions: PropTypes.arrayOf(PropTypes.object),
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
