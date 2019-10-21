import React, { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import ExpirationCountDown from '../../components/DecisionDialog/ExpirationCountDown';
import useAsyncInvestiblesContext from '../../contexts/useAsyncInvestiblesContext';
import MarketNav from '../../components/DecisionDialog/MarketNav';
import Activity from '../../containers/Activity';
import { getMarketId } from '../../utils/marketIdPathFunctions';
import useAsyncMarketStagesContext from '../../contexts/useAsyncMarketStagesContext';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { AsyncCommentsContext } from '../../contexts/AsyncCommentsContext';
import { AsyncMarketPresencesContext } from '../../contexts/AsyncMarketPresencesContext';
import { switchMarket } from '../../contexts/MarketsContext/marketsContextReducer';
import { getCurrentMarket, getAllMarketDetails } from '../../contexts/MarketsContext/marketsContextHelper';


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
  const [marketsState, marketsDispatch] = useContext(MarketsContext);
  const currentMarket = getCurrentMarket(marketsState);
  const marketDetails = getAllMarketDetails(marketsState);
  const { refreshMarketPresence, loading: marketUsersLoading } = useContext(AsyncMarketPresencesContext);
  const { refreshStages, loading: marketStagesLoading } = useAsyncMarketStagesContext();
  const { refreshInvestibles, loading: investiblesLoading } = useAsyncInvestiblesContext();
  const { refreshMarketComments, loading: commentsLoading } = useContext(AsyncCommentsContext);
  const [loadedMarket, setLoadedMarket] = useState(undefined);
  const { hidden } = props;

  useEffect(() => {
    if (marketId && loadedMarket !== marketId) {
      console.debug('Market rerendered on load new');
      setLoadedMarket(marketId);
      marketsDispatch(switchMarket(marketId));
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
  const renderableMarket = marketDetails.find((market) => market.id === marketId);
  console.debug(`Market page being rerendered ${investiblesLoading} ${commentsLoading} ${marketUsersLoading} ${marketStagesLoading}`);
  return (
    <Activity
      title={currentMarketName}
      isLoading={loadedMarket !== marketId
              || investiblesLoading || commentsLoading || marketUsersLoading || marketStagesLoading}
      appBarContent={renderableMarket && (
        <ExpirationCountDown
          expiration_minutes={renderableMarket.expiration_minutes}
          created_at={renderableMarket.created_at}
        />
      )}
      hidden={hidden}
    >
      <div>
        {renderableMarket && (<MarketNav market={renderableMarket} />)}
      </div>
    </Activity>
  );
}

Market.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default injectIntl(withStyles(styles)(React.memo(Market)));
