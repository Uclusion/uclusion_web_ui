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
import useAsyncMarketPresencesContext from '../../contexts/useAsyncMarketPresencesContext';
import useAsyncMarketStagesContext from '../../contexts/useAsyncMarketStagesContext';

const styles = (theme) => ({
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
  const { refreshMarketPresence, loading: marketUsersLoading } = useAsyncMarketPresencesContext();
  const { refreshStages, loading: marketStagesLoading } = useAsyncMarketStagesContext();
  const { refreshInvestibles, loading: investiblesLoading } = useAsyncInvestiblesContext();
  const { refreshMarketComments, loading: commentsLoading } = useAsyncCommentsContext();
  const [loadedMarket, setLoadedMarket] = useState(undefined);
  const { hidden } = props;

  useEffect(() => {
    if (marketId && loadedMarket !== marketId) {
      setLoadedMarket(marketId);
      switchMarket(marketId);
      refreshInvestibles(marketId);
      refreshMarketComments(marketId);
      refreshMarketPresence(marketId);
      refreshStages(marketId);
    }
    return () => {
    };
  }, [marketId, loadedMarket, switchMarket,
    refreshInvestibles, refreshMarketComments, refreshMarketPresence, refreshStages]);

  const currentMarketName = (currentMarket && currentMarket.name) || '';
  // console.debug(marketDetails);
  const renderableMarket = marketDetails.find((market) => market.id === marketId) || {};

  return (
    <Activity
      title={currentMarketName}
      isLoading={loadedMarket !== marketId
              || investiblesLoading || commentsLoading || marketUsersLoading || marketStagesLoading}
      appBarContent={(
        <ExpirationCountDown
          expiration_minutes={renderableMarket.expiration_minutes}
          created_at={renderableMarket.created_at}
        />
)}
      hidden={hidden}
    >
      <div>
        <MarketNav market={renderableMarket} initialTab="context" marketId={marketId} />
      </div>
    </Activity>
  );
}

Market.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default injectIntl(withStyles(styles)(React.memo(Market)));
