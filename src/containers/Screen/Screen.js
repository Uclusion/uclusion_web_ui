import React, { useContext } from 'react';
import _ from 'lodash';
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
import { createTitle, makeBreadCrumbs } from '../../utils/marketIdPathFunctions';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';

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
    isHome
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

  const reallyAmLoading = !hidden && appEnabled && loading;
  const [sidebarOpen] = useContext(SidebarContext);

  if (hidden) {
    return <React.Fragment/>
  }
  let usedBreadCrumbs = breadCrumbs;
  if (_.isEmpty(breadCrumbs) && !isHome) {
    usedBreadCrumbs = makeBreadCrumbs(history);
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
        breadCrumbs={usedBreadCrumbs}
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
          <Card>
            <CardContent>
              <Typography variant="h3" align="center">
                {intl.formatMessage({ id: 'browserNotSupported' })}
              </Typography>
            </CardContent>
          </Card>
        )}
        {isChrome && !reallyAmLoading && (
          <Container className={classes.container}>{children}</Container>
        )}
        {isChrome && true && (
          <Card>
            <CardContent>
              <Typography variant="h3" align="center">
                {intl.formatMessage({ id: 'loadingMessage' })}
              </Typography>
            </CardContent>
          </Card>
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
