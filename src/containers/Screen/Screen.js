import React, { useContext } from 'react'
import _ from 'lodash'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import { CircularProgress, Container, Grid } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { useHistory } from 'react-router'
import { AccountUserContext } from '../../contexts/AccountUserContext/AccountUserContext'
import Header from '../Header'
import ActionBar from '../ActionBar'
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext'
import { createTitle, makeBreadCrumbs } from '../../utils/marketIdPathFunctions'

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
  actionContainer: {
    marginBottom: '-6rem'
  },
  content: {
    background: '#efefef',
  },
  elevated: {
    zIndex: 99,
  },
  loadingDisplay: {
    padding: '95px 20px 156px',
    width: '100%'
  },
  loadingContainer: {
    justifyContent: 'center',
    display: 'flex',
    overflow: 'hidden',
    marginTop: 'calc(50vh - 60px)'
  },
  loadingColor: {
    fill: '#3f6b72'
  }
}));

//const isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);

function Screen(props) {
  const classes = useStyles();
  const [user] = useContext(AccountUserContext) || {};
  const history = useHistory();

  const [messagesState] = useContext(NotificationsContext);

  const {
    breadCrumbs,
    hidden,
    loading,
    title,
    children,
    sidebarActions,
    tabTitle,
    toolbarButtons,
    appEnabled,
    isHome,
    isOnboarding
  } = props;
  let prePendWarning = '';
  if (!_.isEmpty(messagesState)) {
    const { messages } = messagesState;
    let hasYellow = false;
    if (!_.isEmpty(messages)) {
      messages.forEach((message) => {
        const { level } = message;
        if (level === 'RED') {
          prePendWarning += '!';
        } else if (level === 'YELLOW') {
          hasYellow = true;
        }
      });
    }
    if (prePendWarning.length === 0 && hasYellow) {
      prePendWarning = '*';
    }
  }
  console.debug(`is on boarding is ${isOnboarding} and user is ${JSON.stringify(user)}`);
  const reallyAmLoading = !hidden && appEnabled && (loading || (!isOnboarding && _.isEmpty(user)));

  if (hidden) {
    return <React.Fragment/>
  }
  let usedBreadCrumbs = breadCrumbs;
  if (_.isEmpty(breadCrumbs) && !isHome) {
    usedBreadCrumbs = makeBreadCrumbs(history);
  }
  const myContainerClass = classes.containerAll;
  return (
    <div className={classes.root}>
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
        breadCrumbs={usedBreadCrumbs}
        toolbarButtons={toolbarButtons}
        hidden={reallyAmLoading}
        appEnabled={appEnabled}
      />
      {!_.isEmpty(sidebarActions) && !reallyAmLoading && (
        <Container className={classes.actionContainer}><ActionBar actionBarActions={sidebarActions} appEnabled={appEnabled} /></Container>
      )}
      <div className={classes.content}>
        {!reallyAmLoading && (
          <Container className={myContainerClass}>{children}</Container>
        )}
        {reallyAmLoading && (
          <Grid container>
            <Grid item xs={12} className={classes.loadingContainer}>
              <CircularProgress className={classes.loadingColor} size={120} type="indeterminate"></CircularProgress>
            </Grid>
          </Grid>
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
  children: PropTypes.any.isRequired,
  sidebarActions: PropTypes.arrayOf(PropTypes.object),
  tabTitle: PropTypes.string.isRequired,
  appEnabled: PropTypes.bool,
  isHome: PropTypes.bool,
  isOnboarding: PropTypes.bool,
};

Screen.defaultProps = {
  breadCrumbs: [],
  title: '',
  hidden: false,
  loading: false,
  toolbarButtons: [],
  sidebarActions: [],
  appEnabled: true,
  isHome: false,
  isOnboarding: false,
};

export default Screen;
