import React, { useContext, useEffect } from 'react'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router'
import Header from '../../containers/Header'
import { decomposeMarketPath, formMarketLink, navigate, } from '../../utils/marketIdPathFunctions'
import { getMarketFromInvite } from '../../api/uclusionClient'
import { toastError } from '../../utils/userMessage'
import queryString from 'query-string'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { CircularProgress, Grid } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { pollForMarketLoad } from '../../api/versionedFetchUtils'
import _ from 'lodash'
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper'

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
  const [marketsState, marketsDispatch] = useContext(MarketsContext);
  const classes = useStyles();

  useEffect(() => {
    if (!hidden && !marketsState.initializing) {
      const { location } = history;
      const { pathname, hash } = location;
      const { marketId: marketToken } = decomposeMarketPath(pathname);
      const values = queryString.parse(hash);
      const { is_obs: isObserver } = values;
      getMarketFromInvite(marketToken, isObserver === 'true')
        .then((result) => {
          const { market } = result;
          const { id } = market;
          const loadedMarket = getMarket(marketsState, id);
          if (!_.isEmpty(loadedMarket)) {
            // Someone followed an invite link for a market they already had
            navigate(history, formMarketLink(id));
            return;
          }
          return pollForMarketLoad(id, history);
        })
        .catch((error) => {
          console.error(error);
          toastError('errorMarketFetchFailed');
        });
    }
  }, [hidden, history, marketsDispatch, marketsState]);

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
