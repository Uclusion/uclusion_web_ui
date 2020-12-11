import React, { useContext, useEffect } from 'react'
import { Helmet } from 'react-helmet'
import { useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import { useHistory, useLocation } from 'react-router'
import Header from '../../containers/Header'
import { decomposeMarketPath, formMarketLink, navigate, } from '../../utils/marketIdPathFunctions'
import { getMarketFromInvite } from '../../api/uclusionClient'
import { toastError } from '../../utils/userMessage'
import queryString from 'query-string'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { makeStyles } from '@material-ui/styles'
import { createMarketListeners, pollForMarketLoad } from '../../api/versionedFetchUtils'
import _ from 'lodash'
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper'
import { AccountUserContext } from '../../contexts/AccountUserContext/AccountUserContext'
import { userIsLoaded } from '../../contexts/AccountUserContext/accountUserContextHelper'
import LoadingDisplay from '../../components/LoadingDisplay';

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
}));

function MarketInvite(props) {
  const { hidden } = props;
  const intl = useIntl();
  const history = useHistory();
  const location = useLocation();
  const [marketsState, marketsDispatch] = useContext(MarketsContext);
  const [userState] = useContext(AccountUserContext);
  const hasUser = userIsLoaded(userState);
  const classes = useStyles();

  useEffect(() => {
    if (!hidden && !marketsState.initializing && hasUser) {
      const { pathname, hash } = location;
      const { marketId: marketToken } = decomposeMarketPath(pathname);
      const values = queryString.parse(hash);
      const { is_obs: isObserver } = values;
      getMarketFromInvite(marketToken, isObserver === 'true')
        .then((result) => {
          const { market } = result;
          const { id } = market;
          createMarketListeners(id, history);
          const loadedMarket = getMarket(marketsState, id);
          if (!_.isEmpty(loadedMarket)) {
            // Someone followed an invite link for a market they already had
            navigate(history, formMarketLink(id), true);
            return;
          }
          return pollForMarketLoad(id);
        })
        .catch((error) => {
          console.error(error);
          toastError('errorMarketFetchFailed');
        });
    }
  }, [hasUser, hidden, history, location, marketsDispatch, marketsState]);

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
      <LoadingDisplay showMessage messageId="loadingMarket" />
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
