import React, { useContext } from 'react';
import { useHistory } from 'react-router';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  makeBreadCrumbs, decomposeMarketPath, formMarketLink, navigate,
} from '../../utils/marketIdPathFunctions';
import Screen from '../../containers/Screen/Screen';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { DECISION_TYPE, PLANNING_TYPE } from '../../constants/markets';
import DecisionInvestibleAdd from './Decision/DecisionInvestibleAdd';
import PlanningInvestibleAdd from './Planning/PlanningInvestibleAdd';

function InvestibleAdd(props) {
  const { hidden } = props;
  const intl = useIntl();
  const history = useHistory();
  const { location } = history;
  const { pathname } = location;
  const { marketId } = decomposeMarketPath(pathname);
  const [marketsState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const renderableMarket = getMarket(marketsState, marketId) || {};
  const { market_type: marketType } = renderableMarket;
  const currentMarketName = (renderableMarket && renderableMarket.name) || '';
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const myPresence = marketPresences && marketPresences.find((presence) => presence.current_user);
  const myTruePresence = myPresence || {};
  const { is_admin: isAdmin } = myTruePresence;
  const breadCrumbTemplates = [{ name: currentMarketName, link: formMarketLink(marketId) }];
  const myBreadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates, true);
  const newStory = intl.formatMessage({ id: 'newStory' });

  function toggleInvestibleAddMode() {
    navigate(history, formMarketLink(marketId));
  }

  return (
    <Screen
      title={newStory}
      hidden={hidden}
      tabTitle={newStory}
      breadCrumbs={myBreadCrumbs}
    >
      {marketType === DECISION_TYPE && myPresence && (
        <DecisionInvestibleAdd
          marketId={marketId}
          onCancel={toggleInvestibleAddMode}
          onSave={toggleInvestibleAddMode}
          isAdmin={isAdmin}
        />
      )}
      {marketType === PLANNING_TYPE && (
        <PlanningInvestibleAdd
          marketId={marketId}
          onCancel={toggleInvestibleAddMode}
          onSave={toggleInvestibleAddMode}
          marketPresences={marketPresences}
        />
      )}
    </Screen>
  );
}

InvestibleAdd.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default InvestibleAdd;
