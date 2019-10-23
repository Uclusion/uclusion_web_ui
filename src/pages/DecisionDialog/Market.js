import React, { useContext, useEffect } from 'react';
import { useHistory } from 'react-router';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import ExpirationCountDown from '../../components/DecisionDialog/ExpirationCountDown';
import MarketNav from '../../components/DecisionDialog/MarketNav';
import Activity from '../../containers/Activity';
import { getMarketId } from '../../utils/marketIdPathFunctions';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import { refreshMarketStages } from '../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { switchMarket } from '../../contexts/MarketsContext/marketsContextReducer';
import { getCurrentMarket, getAllMarketDetails } from '../../contexts/MarketsContext/marketsContextHelper';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { refreshInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { refreshMarketComments } from '../../contexts/CommentsContext/commentsContextHelper';
import { refreshMarketPresence } from '../../contexts/MarketPresencesContext/marketPresencesHelper';

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
  const currentMarket = getCurrentMarket(marketsState);
  const marketDetails = getAllMarketDetails(marketsState);
  const [, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [, commentsDispatch] = useContext(CommentsContext);
  const { hidden } = props;
  // TODO: Fix the loading
  const investiblesLoading = false;
  const commentsLoading = false;
  const marketStagesLoading = false;
  const marketUsersLoading = false;

  useEffect(() => {
    if (marketId && currentMarket !== marketId) {
      console.debug(`Market rerendered on load ${marketId}`);
      marketsDispatch(switchMarket(marketId));
      refreshInvestibles(investiblesDispatch, marketId);
      refreshMarketComments(commentsDispatch, marketId);
      refreshMarketPresence(marketPresencesDispatch, marketId);
      refreshMarketStages(marketStagesDispatch, marketId);
    }
    return () => {
    };
  }, [
    marketId, currentMarket, marketsDispatch,
    commentsDispatch, marketPresencesDispatch,
    investiblesDispatch, marketStagesDispatch,
    marketsState,
  ]);

  const renderableMarket = marketDetails.find((market) => market.id === marketId);
  console.debug(`Market page being rerendered ${commentsLoading} ${marketUsersLoading} ${marketStagesLoading}`);
  const currentMarketName = (renderableMarket && renderableMarket.name) || '';
  return (
    <Activity
      title={currentMarketName}
      isLoading={currentMarket !== marketId
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
