/* eslint-disable react/forbid-prop-types */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import { withMarketId } from '../../components/PathProps/MarketId';
import ExpirationCountDown from '../../components/DecisionDialog/ExpirationCountDown';
import useAsyncMarketsContext from '../../contexts/useAsyncMarketsContext';
import useAsyncInvestiblesContext from '../../contexts/useAsyncInvestiblesContext';
import useAsyncCommentsContext from '../../contexts/useAsyncCommentsContext';

import MarketNav from '../../components/DecisionDialog/MarketNav';
import Activity from '../../containers/Activity';

const pollRate = 5400000; // 90 mins = 5400 seconds * 1000 for millis

const styles = theme => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  toolbar: {
    width: '100%',
    display: 'flex',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  toolbarButton: {
    margin: theme.spacing(1),
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  stageSelector: {
    display: 'flex',
    alignItems: 'center',
    margin: theme.spacing(),
    marginTop: theme.spacing(2),
    width: 384,
    [theme.breakpoints.only('xs')]: {
      width: '100%',
    },
  },
});

function Market(props) {
  const { switchMarket, currentMarket, marketDetails } = useAsyncMarketsContext();

  const { refreshInvestibles, loading: investiblesLoading } = useAsyncInvestiblesContext();
  const { refreshMarketComments, loading: commentsLoading } = useAsyncCommentsContext();
  const [firstLoad, setFirstLoad] = useState(true);
  const { intl, marketId, hidden } = props;

  useEffect(() => {
    switchMarket(marketId);
  }, [marketId]);

  useEffect(() => {
    if (firstLoad && marketId) {
      refreshInvestibles(marketId);
      refreshMarketComments(marketId);
      setFirstLoad(false);
    }
    const timer = setInterval(() => {
      refreshInvestibles(marketId);
      refreshMarketComments(marketId);
    }, pollRate);
    return () => {
      clearInterval(timer);
    };
  }, [marketId]);

  const currentMarketName = (currentMarket && currentMarket.name) || '';
  // console.debug(marketDetails);
  const renderableMarket = marketDetails.find(market => market.id === marketId) || {};

  return (
    <Activity title={currentMarketName}
              isLoading={investiblesLoading || commentsLoading}
              appBarContent={<ExpirationCountDown {...renderableMarket} />}
              hidden={hidden}
    >
      <div>
        <MarketNav market={renderableMarket} initialTab="context" marketId={marketId}/>
      </div>
    </Activity>
  );
}

Market.propTypes = {
  intl: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
};

export default injectIntl(withStyles(styles)(withMarketId(React.memo(Market))));
