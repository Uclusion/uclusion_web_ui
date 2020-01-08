import React, { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import localforage from 'localforage';
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
  const [storedDescription, setStoredDescription] = useState(undefined);
  const [idLoaded, setIdLoaded] = useState(undefined);

  function toggleInvestibleAddMode() {
    setIdLoaded(undefined);
    localforage.removeItem(`add_investible_${marketId}`)
      .then(() => navigate(history, formMarketLink(marketId)));
  }

  useEffect(() => {
    if (!hidden) {
      localforage.getItem(`add_investible_${marketId}`).then((description) => {
        setStoredDescription(description || '');
        setIdLoaded(marketId);
      });
    }
    if (hidden) {
      setIdLoaded(undefined);
    }
  }, [hidden, marketId]);


  return (
    <Screen
      title={newStory}
      hidden={hidden}
      tabTitle={newStory}
      breadCrumbs={myBreadCrumbs}
    >
      {marketType === DECISION_TYPE && myPresence && idLoaded === marketId && (
        <DecisionInvestibleAdd
          marketId={marketId}
          onCancel={toggleInvestibleAddMode}
          onSave={toggleInvestibleAddMode}
          isAdmin={isAdmin}
          storedDescription={storedDescription}
        />
      )}
      {marketType === PLANNING_TYPE && idLoaded === marketId && (
        <PlanningInvestibleAdd
          marketId={marketId}
          onCancel={toggleInvestibleAddMode}
          onSave={toggleInvestibleAddMode}
          marketPresences={marketPresences}
          storedDescription={storedDescription}
        />
      )}
    </Screen>
  );
}

InvestibleAdd.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default InvestibleAdd;
