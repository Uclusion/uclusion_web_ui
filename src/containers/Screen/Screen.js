import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import clsx from 'clsx';
import { Container, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { useHistory } from 'react-router';
import { useIntl } from 'react-intl';
import Header from '../Header';
import Sidebar from '../Sidebar';
import { SidebarContext } from '../../contexts/SidebarContext';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import {
  DRAWER_WIDTH_CLOSED,
  DRAWER_WIDTH_OPENED,
} from '../../constants/global';
import { createTitle } from '../../utils/marketIdPathFunctions'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';

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
    padding: '41px 20px 156px',
  },
  contentShift: {
    marginLeft: DRAWER_WIDTH_OPENED,
    width: `calc(100% - ${DRAWER_WIDTH_OPENED}px)`,
    [theme.breakpoints.down('xs')]: {
      marginLeft: DRAWER_WIDTH_CLOSED,
      width: `calc(100% - ${DRAWER_WIDTH_CLOSED}px)`,
    },
  },
  loadingDisplay: {
    marginLeft: DRAWER_WIDTH_OPENED * 2,
  },
  contentUnShift: {
    marginLeft: DRAWER_WIDTH_CLOSED,
    width: `calc(100% - ${DRAWER_WIDTH_CLOSED}px)`,
  },
  content: {
    background: '#efefef',
  },
  elevated: {
    zIndex: 99,
  },
}));

const isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);

function Screen(props) {
  const classes = useStyles();
  // enable scrolling based on hash
  const history = useHistory();
  const intl = useIntl();
  const [messagesState] = useContext(NotificationsContext);
  const { location } = history;

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
  } = props;
  let prePendWarning = '';
  if (messagesState) {
    const { messages } = messagesState;
    let hasYellow = false;
    messages.forEach((message) => {
      const { level } = message;
      if (level === 'RED') {
        prePendWarning += '*';
      } else {
        hasYellow = true;
      }
    });
    if (prePendWarning.length === 0 && hasYellow) {
      prePendWarning = '*';
    }
  }

  const [operationRunning] = useContext(OperationInProgressContext);
  const [scrollerBound, setScrollerBound] = useState(undefined);
  const reallyAmLoading = !hidden && appEnabled && loading;
  const doneLoading = !hidden && appEnabled && !loading;
  useEffect(() => {
    function scroller(myLocation) {
      const { hash } = myLocation;
      if (hash && hash.length > 1) {
        const target = hash.substring(1, hash.length);
        if (target) {
          console.log('Scroller firing');
          const element = document.getElementById(target);
          if (element) {
            element.scrollIntoView();
          } else {
            console.warn(`No element found for target ${target}`);
            return false;
          }
        }
      } else {
        window.scrollTo(0, 0);
      }
      return true;
    }
    if (doneLoading && scrollerBound !== location) {
      if (scroller(location)) {
        setScrollerBound(location);
      }
    }
    return () => {};
  }, [location, operationRunning, reallyAmLoading, history, hidden, appEnabled, scrollerBound,
    doneLoading]);
  
  const [sidebarOpen] = useContext(SidebarContext);

  if (hidden) {
    return <React.Fragment/>
  }

  return (
    <div className={classes.root}>
      <Helmet>
        <title>
          {`${prePendWarning}Uclusion | ${createTitle(
            tabTitle,
            11,
          )}`}
        </title>
      </Helmet>
      <Header
        title={title}
        breadCrumbs={breadCrumbs}
        toolbarButtons={toolbarButtons}
        hidden={reallyAmLoading}
      />
      <Sidebar sidebarActions={sidebarActions} />
      <div
        className={clsx(classes.content, {
          [classes.contentShift]: sidebarOpen,
          [classes.contentUnShift]: !sidebarOpen,
        })}
      >
        {!isChrome && (
          <div className={classes.loadingDisplay}>
            <Typography variant="h3">
              {intl.formatMessage({ id: 'browserNotSupported' })}
            </Typography>
          </div>
        )}
        {isChrome && !reallyAmLoading && (
          <Container className={classes.container}>{children}</Container>
        )}
        {isChrome && reallyAmLoading && (
          <div className={classes.loadingDisplay}>
            <Typography variant="h3">
              {intl.formatMessage({ id: 'loadingMessage' })}
            </Typography>
          </div>
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
  // eslint-disable-next-line react/forbid-prop-types
  title: PropTypes.any,
  // eslint-disable-next-line react/forbid-prop-types
  children: PropTypes.any.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  sidebarActions: PropTypes.arrayOf(PropTypes.element),
  tabTitle: PropTypes.string.isRequired,
  appEnabled: PropTypes.bool,
  isHome: PropTypes.bool,
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
};

export default Screen;
