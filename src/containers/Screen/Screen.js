import React, { useContext } from 'react'
import _ from 'lodash'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import { Container, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { useHistory } from 'react-router'
import { useIntl } from 'react-intl'
import Header from '../Header'
import ActionBar from '../ActionBar'
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext'
import { createTitle, makeBreadCrumbs } from '../../utils/marketIdPathFunctions'
import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'

const useStyles = makeStyles(() => ({
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
    padding: '46px 20px 156px',
    marginTop: '80px',
    width: '100%'
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
}));

//const isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);

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
  if (!_.isEmpty(messagesState)) {
    const { messages } = messagesState;
    let hasYellow = false;
    if (!_.isEmpty(messages)) {
      messages.forEach((message) => {
        const { level } = message;
        if (level === 'RED') {
          prePendWarning += '!';
        } else {
          hasYellow = true;
        }
      });
    }
    if (prePendWarning.length === 0 && hasYellow) {
      prePendWarning = '*';
    }
  }

  const reallyAmLoading = !hidden && appEnabled && loading;

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
        appEnabled={appEnabled}
      />
      {!_.isEmpty(sidebarActions) && (
        <Container className={classes.actionContainer}><ActionBar actionBarActions={sidebarActions} appEnabled={appEnabled} /></Container>
      )}
      <div className={classes.content}>
        {!reallyAmLoading && (
          <Container className={myContainerClass}>{children}</Container>
        )}
        {reallyAmLoading && (
          <Card>
            <CardContent className={classes.loadingDisplay}>
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
  title: PropTypes.any,
  children: PropTypes.any.isRequired,
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
