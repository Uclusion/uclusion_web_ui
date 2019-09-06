/* eslint-disable react/forbid-prop-types */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import { withMarketId } from '../../components/PathProps/MarketId';

import useAsyncMarketsContext from '../../contexts/useAsyncMarketsContext';
import useAsyncInvestiblesContext from '../../contexts/useAsyncInvestiblesContext';

import MarketNav from './MarketNav';
import Activity from '../../containers/Activity'
import { Typography } from '@material-ui/core';
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
  const { switchMarket, currentMarket } = useAsyncMarketsContext();

  const { refreshInvestibles, loading } = useAsyncInvestiblesContext();
  const [firstLoad, setFirstLoad] = useState(true);
  const {
    intl,
    history,
    classes,
    location,
    marketId,
  } = props;

  useEffect(() => {
    switchMarket(marketId);
  });

  useEffect(() => {
    if (firstLoad && marketId) {
      refreshInvestibles(marketId);
      setFirstLoad(false);
    } else {
    }
    const timer = setInterval(() => refreshInvestibles(marketId), pollRate);
    return () => {
      clearInterval(timer);
    };
  }, [marketId]);

  const currentMarketName = (currentMarket && currentMarket.name) || '';
  return (
    <Activity title={currentMarketName} isLoading={loading}>
      <div>
        <MarketNav initialTab="context" marketId={marketId}/>
      </div>
    </Activity>
  );
}

Market.propTypes = {
  intl: PropTypes.object.isRequired,
  classes: PropTypes.object,
  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
};

export default injectIntl(withStyles(styles)(withMarketId(React.memo(Market))));
