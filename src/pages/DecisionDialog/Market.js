/* eslint-disable react/forbid-prop-types */
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import ExpirationCountDown from '../../components/DecisionDialog/ExpirationCountDown';
import useAsyncMarketsContext from '../../contexts/useAsyncMarketsContext';
import useAsyncInvestiblesContext from '../../contexts/useAsyncInvestiblesContext';
import useAsyncCommentsContext from '../../contexts/useAsyncCommentsContext';
import MarketNav from '../../components/DecisionDialog/MarketNav';
import Activity from '../../containers/Activity';
import { getMarketId } from '../../utils/marketIdPathFunctions';

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
  const history = useHistory();
  const { location } = history;
  const { pathname } = location;
  const marketId = getMarketId(pathname);
  const { switchMarket, currentMarket, marketDetails } = useAsyncMarketsContext();

  const { refreshInvestibles, loading: investiblesLoading } = useAsyncInvestiblesContext();
  const { refreshMarketComments, loading: commentsLoading } = useAsyncCommentsContext();
  const [loadedMarket, setLoadedMarket] = useState(undefined);
  const { hidden } = props;

  useEffect(() => {
    if (marketId && loadedMarket !== marketId) {
      switchMarket(marketId);
      refreshInvestibles(marketId);
      refreshMarketComments(marketId);
      setLoadedMarket(marketId);
    }
    return () => {
    };
  }, [marketId, loadedMarket, switchMarket, refreshInvestibles, refreshMarketComments]);

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
};

export default injectIntl(withStyles(styles)(React.memo(Market)));
