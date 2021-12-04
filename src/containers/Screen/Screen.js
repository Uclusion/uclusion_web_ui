import React, { useContext, useEffect, useState } from 'react'
import _ from 'lodash'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import { Container, ListItem, ListItemText, Paper, useMediaQuery, useTheme } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { useHistory } from 'react-router'
import { AccountUserContext } from '../../contexts/AccountUserContext/AccountUserContext'
import Header from '../Header'
import ActionBar from '../ActionBar'
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext'
import { createTitle, makeBreadCrumbs, navigate, preventDefaultAndProp } from '../../utils/marketIdPathFunctions'
import LoadingDisplay from '../../components/LoadingDisplay';
import List from '@material-ui/core/List'
import SearchBox from '../../components/Search/SearchBox'
import clsx from 'clsx'
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
  lessContent: {
    marginLeft: '12rem'
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
  elevated: {
    zIndex: 99,
  },
}));

function processRegularItem (classes, history, text, target, num, Icon, onClickFunc, isGrouped, isBold, newPage,
  index, search, showSearch) {
  if (!text) {
    return React.Fragment
  }
  const textNoSpaces = text.split(' ').join('')
  if (!target && !onClickFunc) {
    return (
      <ListItem key={`noOnClick${index}${textNoSpaces}`} style={{cursor: 'unset'}}
                className={isGrouped ? classes.navListItemGrouped : classes.navListItem}>
        <Icon className={clsx(classes.navListIcon, classes.disabled)}/>
        <ListItemText primary={text} primaryTypographyProps={{ className: classes.disabled }}/>
      </ListItem>
    )
  }
  return (
    <ListItem key={`${index}${textNoSpaces}`} id={textNoSpaces} selected={isBold}
              className={isGrouped ? classes.navListItemGrouped : classes.navListItem}
              onClick={
                (event) => {
                  preventDefaultAndProp(event)
                  if (onClickFunc) {
                    onClickFunc()
                  } else {
                    navigate(history, target, false, !newPage)
                  }
                }
              }
    >
      <Icon className={classes.navListIcon} />
      <span style={{width: showSearch ? '80%' : '100%'}}>
                      <ListItemText primary={text}
                                    primaryTypographyProps={{className: isBold ? classes.navGroupHeader : undefined}} />
                    </span>
      {num !== undefined && !_.isEmpty(search) && (
        <span style={{width: "17%"}}><ListItemText primary={num} /></span>
      )}
    </ListItem>
  );
}

function Screen(props) {
  const classes = useStyles();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('md'));
  const [userState] = useContext(AccountUserContext);
  const { user: unsafeUser } = userState;
  const user = unsafeUser || {};
  const history = useHistory();
  const [messagesState] = useContext(NotificationsContext);
  const [searchResults] = useContext(SearchResultsContext);
  const { search } = searchResults;
  const [prePendWarning, setPrePendWarning] = useState('');

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
    isWorkspace,
    isInbox,
    isPending
  } = props;

  useEffect(() => {
    if (!_.isEmpty(messagesState)) {
      let calcPrePend = '';
      const { messages } = messagesState;
      let hasYellow = false;
      const dupeHash = {};
      if (!_.isEmpty(messages)) {
        messages.forEach((message) => {
          const { level, link_multiple: linkMultiple, is_highlighted: isHighlighted } = message;
          if (isHighlighted) {
            if (level === 'RED') {
              if (!linkMultiple) {
                calcPrePend += '!';
              } else if (!(linkMultiple in dupeHash)) {
                dupeHash[linkMultiple] = message;
                calcPrePend += '!';
              }
            } else if (level === 'YELLOW') {
              hasYellow = true;
            }
          }
        });
      }
      if (calcPrePend.length === 0 && hasYellow) {
        calcPrePend = '*';
      }
      setPrePendWarning(calcPrePend);
    }
  }, [messagesState]);

  const reallyAmLoading = !hidden && appEnabled && (loading || _.isEmpty(user));

  if (hidden) {
    return <React.Fragment/>
  }
  let usedBreadCrumbs = breadCrumbs;
  if (_.isEmpty(breadCrumbs)) {
    usedBreadCrumbs = makeBreadCrumbs(history);
  }
  const { navListItemTextArray, navMenu, showSearch = true } = navigationOptions || {}
  const myContainerClass = navigationOptions && !mobileLayout ? classes.containerAllLeftPad : classes.containerAll
  const contentClass = mobileLayout ? classes.contentNoStyle : (isPending ? classes.pending :
    navigationOptions ? (isInbox ? classes.lessContent : classes.content) : classes.contentNoStyle);
  const sideNavigationContents = _.isEmpty(navListItemTextArray) ? undefined : (
    <>
      {navMenu}
      <List>
        {navListItemTextArray.map((navItem, topIndex) => {
          const { text, target, num, icon: Icon, onClickFunc, subItems, isBold, newPage } = navItem;
          if (subItems) {
            return (
              <div key={`top${topIndex}${text}${title}`}
                   style={{ paddingBottom: '0.5rem', backgroundColor: '#F5F5F5' }}>
                <ListItem key={`topListItem${topIndex}${text}${title}`} onClick={onClickFunc}
                          style={{ paddingBottom: 0, cursor: 'pointer' }}>
                  <ListItemText primary={text}
                                primaryTypographyProps={{ className: isBold ? classes.navGroupHeader : undefined }}
                  />
                </ListItem>
                <div>
                  {subItems.map((subItem, index) => {
                    const { text, target, num, icon: Icon, onClickFunc, newPage } = subItem
                    return processRegularItem(classes, history, text, target, num, Icon, onClickFunc,
                      true, false, newPage, index, search, showSearch)
                  })}
                </div>
              </div>
            );
          }
          return processRegularItem(classes, history, text, target, num, Icon, onClickFunc, false,
            isBold, newPage, topIndex, search, showSearch)
        })}
      </List>
      {showSearch && (
        <SearchBox/>
      )}
    </>
  );
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
        isWorkspace={isWorkspace}
        navMenu={sideNavigationContents}
        isInbox={isInbox}
        isPending={isPending}
      />
      {!_.isEmpty(navListItemTextArray) && !mobileLayout && (
        <div className={classes.listContainer}>
          <Paper className={classes.paper} style={{minWidth: showSearch ? undefined : '10rem'}} elevation={3}
                 id="navList">
            {sideNavigationContents}
          </Paper>
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
  banner: PropTypes.node,
  isWorkspace: PropTypes.bool
};

Screen.defaultProps = {
  breadCrumbs: [],
  title: '',
  tabTitle: '',
  titleIcon: undefined,
  hidden: false,
  loading: false,
  toolbarButtons: [],
  sidebarActions: [],
  appEnabled: true,
  banner: undefined,
  isWorkspace: false
};

export default Screen;
