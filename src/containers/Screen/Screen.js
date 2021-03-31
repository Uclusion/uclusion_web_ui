import React, { useContext } from 'react'
import _ from 'lodash'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import { Container, ListItem, ListItemText, Paper } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { useHistory } from 'react-router'
import { AccountUserContext } from '../../contexts/AccountUserContext/AccountUserContext'
import Header from '../Header'
import ActionBar from '../ActionBar'
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext'
import { createTitle, makeBreadCrumbs, navigate } from '../../utils/marketIdPathFunctions'
import LoadingDisplay from '../../components/LoadingDisplay';
import List from '@material-ui/core/List'
import { isTinyWindow } from '../../utils/windowUtils'
import Typography from '@material-ui/core/Typography'
import SearchBox from '../../components/Search/SearchBox'
import clsx from 'clsx'
import SearchResults from '../../components/Search/SearchResults'
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext'

const useStyles = makeStyles((theme) => ({
  hidden: {
    display: 'none',
  },
  root: {
    display: 'flex',
    flexDirection: 'column',
  },
  container: {
    background: '#efefef',
    padding: '46px 20px 156px',
  },
  containerAll: {
    background: '#efefef',
    padding: '24px 20px 156px',
    marginTop: '80px',
    width: '100%',
    [theme.breakpoints.down('sm')]: {
      padding: '24px 12px 156px',
    },
  },
  containerAllLeftPad: {
    background: '#efefef',
    padding: '24px 20px 156px 25px',
    marginTop: '80px',
    width: '100%',
    [theme.breakpoints.down('sm')]: {
      padding: '24px 12px 156px',
    },
  },
  containerSearchResults: {
    background: '#efefef',
    padding: '24px 20px 156px 500px',
    marginTop: '80px',
    width: '100%',
    [theme.breakpoints.down('sm')]: {
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
  navList: {
    backgroundColor: 'white'
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
  paper: {
    // See https://github.com/mui-org/material-ui/blob/master/packages/material-ui/src/Drawer/Drawer.js
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    flex: '1 0 auto',
    zIndex: 8,
    WebkitOverflowScrolling: 'touch',
    position: 'fixed',
    top: '7rem',
    background: '#efefef',
    minWidth: '13rem',
  },
  actionContainer: {
    marginTop: '5rem',
    marginBottom: '-6rem'
  },
  contentMobile: {
    background: '#efefef',
  },
  content: {
    background: '#efefef',
    marginLeft: '15rem'
  },
  contentSearch: {
    background: '#efefef',
    paddingLeft: '33rem'
  },
  disabled: {
    color: theme.palette.text.disabled
  },
  elevated: {
    zIndex: 99,
  },
}));

//const isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);

function Screen(props) {
  const classes = useStyles();
  const [userState] = useContext(AccountUserContext);
  const [searchResults] = useContext(SearchResultsContext);
  const { results } = searchResults;
  const { user: unsafeUser } = userState;
  const user = unsafeUser || {};
  const history = useHistory();

  const [messagesState] = useContext(NotificationsContext);

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
    isHome,
    banner,
    navigationOptions
  } = props;
  let prePendWarning = '';
  if (!_.isEmpty(messagesState)) {
    const { messages } = messagesState;
    let hasYellow = false;
    const dupeHash = {};
    if (!_.isEmpty(messages)) {
      messages.forEach((message) => {
        const { level, link_multiple: linkMultiple } = message;
        if (level === 'RED') {
          if (!linkMultiple) {
            prePendWarning += '!';
          } else if (!(linkMultiple in dupeHash)) {
            dupeHash[linkMultiple] = message;
            prePendWarning += '!';
          }
        } else if (level === 'YELLOW') {
          hasYellow = true;
        }
      });
    }
    if (prePendWarning.length === 0 && hasYellow) {
      prePendWarning = '*';
    }
  }
  const reallyAmLoading = !hidden && appEnabled && (loading || _.isEmpty(user));

  if (hidden) {
    return <React.Fragment/>
  }
  let usedBreadCrumbs = breadCrumbs;
  if (_.isEmpty(breadCrumbs) && !isHome) {
    usedBreadCrumbs = makeBreadCrumbs(history);
  }
  const { navHeaderText, navListItemTextArray, showSearchResults } = navigationOptions || {};
  const myContainerClass = navigationOptions && !isTinyWindow() ? classes.containerAllLeftPad : classes.containerAll;
  const contentClass = isTinyWindow() ? classes.contentMobile : showSearchResults && !_.isEmpty(results) ?
    classes.contentSearch : classes.content;
  return (
    <div className={classes.root} id="root">
      <Helmet defer={false}>
        <title>
          {`${prePendWarning}Uclusion | ${createTitle(
            tabTitle,
            11,
          )}`}
        </title>
      </Helmet>
      <Header
        title={title}
        titleIcon={titleIcon}
        breadCrumbs={usedBreadCrumbs}
        toolbarButtons={toolbarButtons}
        hidden={reallyAmLoading}
        appEnabled={appEnabled}
      />
      {!_.isEmpty(navListItemTextArray) && !isTinyWindow() && (
        <div className={classes.listContainer}>
          <Paper className={classes.paper}>
            <List className={classes.navList}
                  subheader={
                    <Typography align="center" variant="h6" style={{paddingTop: '1rem'}} id="nested-list-subheader">
                      {navHeaderText}
                    </Typography>
                  }
            >
              {navListItemTextArray.map((navItem) => {
                const { text, target, num, icon: Icon } = navItem;
                if (!text) {
                  return React.Fragment;
                }
                if (!target) {
                  return (
                    <ListItem key={text}>
                      <Icon className={clsx(classes.navListIcon, classes.disabled)} />
                      <ListItemText primary={text} primaryTypographyProps={{className: classes.disabled}} />
                    </ListItem>
                  );
                }
                return (
                  <ListItem key={text} className={classes.navListItem}
                            onClick={
                              (event) => {
                                event.stopPropagation();
                                event.preventDefault();
                                navigate(history, target);
                              }
                            }
                  >
                    <Icon className={classes.navListIcon} />
                    <span style={{width: "80%"}}>
                      <ListItemText primary={text} />
                    </span>
                    {num !== undefined && (
                      <span style={{width: "17%"}}><ListItemText primary={num} /></span>
                    )}
                  </ListItem>
                );
              })}
            </List>
            <SearchBox/>
          </Paper>
          {showSearchResults && (
            <SearchResults placement="right"/>
          )}
        </div>
      )}
      {banner && (
        <Container className={classes.bannerContainer}>
          {banner}
        </Container>
      )}
      {!_.isEmpty(sidebarActions) && !reallyAmLoading && (
        <Container className={classes.actionContainer} id="actionContainer">
          <ActionBar actionBarActions={sidebarActions} appEnabled={appEnabled} />
        </Container>
      )}
      <div className={contentClass}>
        {!reallyAmLoading && (
          <Container className={myContainerClass} maxWidth="xl">
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
  children: PropTypes.any.isRequired,
  sidebarActions: PropTypes.arrayOf(PropTypes.object),
  tabTitle: PropTypes.string.isRequired,
  appEnabled: PropTypes.bool,
  isHome: PropTypes.bool,
  banner: PropTypes.node,
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
  isHome: false,
  banner: undefined,
};

export default Screen;
