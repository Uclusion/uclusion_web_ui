import React, { useContext } from 'react'
import _ from 'lodash'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import { Container } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { useHistory } from 'react-router'
import { AccountUserContext } from '../../contexts/AccountUserContext/AccountUserContext'
import Header from '../Header'
import ActionBar from '../ActionBar'
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext'
import { createTitle, makeBreadCrumbs } from '../../utils/marketIdPathFunctions'
import LoadingDisplay from '../../components/LoadingDisplay';

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
}));

//const isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);

function Screen(props) {
  const classes = useStyles();
  const [userState] = useContext(AccountUserContext);
  const { user: unsafeUser } = userState;
  const user = unsafeUser || {};
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
    banner
  } = props;
  let prePendWarning = '';
  if (!_.isEmpty(messagesState)) {
    const { messages } = messagesState;
    let hasYellow = false;
    const pageHash = {};
    if (!_.isEmpty(messages)) {
      messages.forEach((message) => {
        const { level } = message;
        if (level === 'RED') {
          const hash = `${message.marketId}_${message.investibleId}`;
          if (!(hash in pageHash)) {
            pageHash[hash] = message;
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
  const myContainerClass = classes.containerAll;
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
        breadCrumbs={usedBreadCrumbs}
        toolbarButtons={toolbarButtons}
        hidden={reallyAmLoading}
        appEnabled={appEnabled}
      />
      {banner && (
        <Container className={classes.bannerContainer}>
          {banner}
        </Container>
      )}
      {!_.isEmpty(sidebarActions) && !reallyAmLoading && (
        <Container className={classes.actionContainer}>
          <ActionBar actionBarActions={sidebarActions} appEnabled={appEnabled} />
        </Container>
      )}
      <div className={classes.content}>
        {!reallyAmLoading && (
          <Container className={myContainerClass}>
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
  hidden: false,
  loading: false,
  toolbarButtons: [],
  sidebarActions: [],
  appEnabled: true,
  isHome: false,
  banner: undefined,
};

export default Screen;
