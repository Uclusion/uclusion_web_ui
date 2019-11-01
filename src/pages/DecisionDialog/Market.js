import React, { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import { navigate } from '../../utils/marketIdPathFunctions';
import MarketNav from './MarketNav';
import Screen from '../../containers/Activity/Screen';
import { getMarketId } from '../../utils/marketIdPathFunctions';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import { refreshMarketStages } from '../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getAllMarketDetails } from '../../contexts/MarketsContext/marketsContextHelper';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { refreshInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { refreshMarketComments } from '../../contexts/CommentsContext/commentsContextHelper';
import { refreshMarketPresence } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import Summary from './Summary';

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
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, marketStagesDispatch] = useContext(MarketStagesContext);
  const marketDetails = getAllMarketDetails(marketsState);
  const [, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [, commentsDispatch] = useContext(CommentsContext);
  const [loadedMarket, setLoadedMarket] = useState(undefined);
  const { hidden } = props;
  // TODO: Fix the loading
  const investiblesLoading = false;
  const commentsLoading = false;
  const marketStagesLoading = false;
  const marketUsersLoading = false;

  useEffect(() => {
    if (marketId && loadedMarket !== marketId) {
      console.debug('Market rerendered on load new');
      setLoadedMarket(marketId);
      refreshInvestibles(investiblesDispatch, marketId);
      refreshMarketComments(commentsDispatch, marketId);
      refreshMarketPresence(marketPresencesDispatch, marketId);
      refreshMarketStages(marketStagesDispatch, marketId);
    }
    return () => {
    };
  }, [
    marketId, marketsDispatch, loadedMarket,
    commentsDispatch, marketPresencesDispatch,
    investiblesDispatch, marketStagesDispatch,
    marketsState,
  ]);

  const breadCrumbs = [
    {
      title: 'Home',
      onClick: () => navigate(history, '/'),
    },
  ];

  const renderableMarket = marketDetails.find((market) => market.id === marketId);
  console.debug(`Market page being rerendered ${commentsLoading} ${marketUsersLoading} ${marketStagesLoading}`);
  const currentMarketName = (renderableMarket && renderableMarket.name) || '';
  return (
    <Screen
      title={currentMarketName}
      hidden={hidden}
      breadCrumbs={breadCrumbs}
    >
      { renderableMarket && <Summary market={renderableMarket}/> }
    </Screen>
  );
}

Market.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default injectIntl(withStyles(styles)(React.memo(Market)));
