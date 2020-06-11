import React, { useContext, useEffect, useState } from 'react'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router'
import _ from 'lodash'
import Header from '../../containers/Header'
import { decomposeMarketPath, formMarketLink, navigate, } from '../../utils/marketIdPathFunctions'
import { VERSIONS_HUB_CHANNEL } from '../../contexts/WebSocketContext'
import { getMarketFromInvite } from '../../api/uclusionClient'
import { registerListener } from '../../utils/MessageBusUtils'
import { toastError } from '../../utils/userMessage'
import queryString from 'query-string'
import { NEW_MARKET } from '../../contexts/VersionsContext/versionsContextMessages'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { AccountUserContext } from '../../contexts/AccountUserContext/AccountUserContext'
import { CircularProgress, Grid } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'

const useStyles = makeStyles((theme) => ({
  hidden: {
    display: 'none',
  },
  normal: {},
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

function MarketInvite(props) {
  const { hidden } = props;
  const intl = useIntl();
  const history = useHistory();
  const { location } = history;
  const { pathname } = location;
  const { hash } = location;
  const { marketId: marketToken } = decomposeMarketPath(pathname);
  const [myLoading, setMyLoading] = useState(undefined);
  const [marketState] = useContext(MarketsContext);
  const [userState] = useContext(AccountUserContext) || {};
  const classes = useStyles();

  useEffect(() => {
    if (!hidden && myLoading !== marketToken && !_.isEmpty(userState)) {
      setMyLoading(marketToken);
      const values = queryString.parse(hash);
      const { is_obs: isObserver } = values;
      getMarketFromInvite(marketToken, isObserver === 'true')
        .then((result) => {
          const { is_new_capability: loggedIntoNewMarket, market_id: myMarketId } = result;
          console.debug(`Logged into market ${myMarketId}`);
          if (!loggedIntoNewMarket) {
            navigate(history, formMarketLink(myMarketId));
          } else {
            registerListener(VERSIONS_HUB_CHANNEL, 'inviteListener', (data) => {
              const { payload: { event, marketId: messageMarketId } } = data;
              switch (event) {
                case  NEW_MARKET: {
                  if (messageMarketId === myMarketId) {
                    console.log(`Redirecting us to market ${myMarketId}`);
                    setTimeout(() => {
                      navigate(history, formMarketLink(myMarketId));
                    }, 500);
                  }
                  break;
                }
                default:
                  // ignore
                  break;
              }
            });
          }
        })
        .catch((error) => {
          console.error(error);
          toastError('errorMarketFetchFailed');
        });
    }
  }, [hidden, marketToken, history, hash, marketState, myLoading, userState]);

  if (hidden) {
    return <React.Fragment/>
  }
  
  return (
    <div className={hidden ? classes.hidden : classes.normal}>
    <Helmet
      defer={false}
    >
      <title>{intl.formatMessage({ id: 'loadingMarket' })}</title>
    </Helmet>)
    <Header
      title={intl.formatMessage({ id: 'loadingMarket' })}
      breadCrumbs={[]}
      toolbarButtons={[]}
      hidden={hidden}
      appEnabled
      logoLinkDisabled
      hideTools
    />
    <div className={classes.content}>
      <Grid container>
        <Grid item xs={12} className={classes.loadingContainer}>
          <CircularProgress className={classes.loadingColor} size={120} type="indeterminate"/>
        </Grid>
      </Grid>
    </div>
  </div>
  );
}

MarketInvite.propTypes = {
  hidden: PropTypes.bool,
};

MarketInvite.defaultProps = {
  hidden: false,
};

export default MarketInvite;
