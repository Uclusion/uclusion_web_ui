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
import { getMarketDetails } from '../../api/markets';
import { addMarketToStorage } from '../../contexts/MarketsContext/marketsContextHelper';
import { DiffContext } from '../../contexts/DiffContext/DiffContext';

const useStyles = makeStyles((theme) => ({
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
  const [marketState, marketsDispatch] = useContext(MarketsContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [userState] = useContext(AccountUserContext) || {};
  const classes = useStyles();

  useEffect(() => {
    if (!hidden && myLoading !== marketToken && !_.isEmpty(userState)) {
      setMyLoading(marketToken);
      const values = queryString.parse(hash);
      const { is_obs: isObserver } = values;
      getMarketFromInvite(marketToken, isObserver === 'true')
        .then((result) => {
          const { market_id: myMarketId, user } = result;
          return new Promise((resolve, reject) => {
            const maxRetries = 20;
            let currentCount = 0;
            const fetcher = () => {
              getMarketDetails(marketId)
                .then((details) => resolve(details))
                .catch((error) => {
                  if (currentCount < maxRetries) {
                    currentCount += 1;
                    setTimeout(fetcher, 3000);
                  } else {
                    reject(error);
                  }
                });
            };
            setTimeout(fetcher, 3000);
          });
        })
        .then((details) => {
          addMarketToStorage(marketsDispatch, diffDispatch, details, false);
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
    <div>
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
