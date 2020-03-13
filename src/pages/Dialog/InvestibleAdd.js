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
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { DiffContext } from '../../contexts/DiffContext/DiffContext';
import { addInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { usePlanFormStyles } from '../../components/AgilePlan'

function InvestibleAdd(props) {
  const { hidden } = props;
  const intl = useIntl();
  const history = useHistory();
  const { location } = history;
  const { pathname } = location;
  const { marketId } = decomposeMarketPath(pathname);
  const [marketsState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  // we're going to talk directly to the contexts instead of pushing messages for speed reasons
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const classes = usePlanFormStyles();
  const renderableMarket = getMarket(marketsState, marketId) || {};
  const { market_type: marketType } = renderableMarket;
  const currentMarketName = (renderableMarket && renderableMarket.name) || '';
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const myPresence = marketPresences && marketPresences.find((presence) => presence.current_user);
  const myTruePresence = myPresence || {};
  const { is_admin: isAdmin } = myTruePresence;
  const breadCrumbTemplates = [{ name: currentMarketName, link: formMarketLink(marketId) }];
  const myBreadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates, true);
  const titleKey = marketType === PLANNING_TYPE? 'newStory' : 'newOption';
  const title = intl.formatMessage({ id: titleKey});
  const [storedState, setStoredState] = useState(undefined);
  const [idLoaded, setIdLoaded] = useState(undefined);

  function onInvestibleSave(investible) {
    addInvestible(investiblesDispatch, diffDispatch, investible);
  }

  const itemKey = `add_investible_${marketId}`;
  function onDone(destinationLink) {
    console.log(`Called with link ${destinationLink}`);
    localforage.removeItem(itemKey)
      .finally(() => {
        if (destinationLink) {
          navigate(history, destinationLink);
        }
      });
  }

  useEffect(() => {
    if (!hidden) {
      localforage.getItem(itemKey).then((stateFromDisk) => {
        setStoredState(stateFromDisk || {});
        setIdLoaded(marketId);
      });
    }
    if (hidden) {
      setIdLoaded(undefined);
    }
  }, [hidden, marketId, itemKey]);

  const loading = idLoaded !== marketId || !marketType
    || (marketType === DECISION_TYPE && !myPresence);
  return (
    <Screen
      title={title}
      hidden={hidden}
      tabTitle={title}
      breadCrumbs={myBreadCrumbs}
      loading={loading}
    >
      {marketType === DECISION_TYPE && myPresence && idLoaded === marketId && (
        <DecisionInvestibleAdd
          marketId={marketId}
          onSave={onInvestibleSave}
          onCancel={onDone}
          onSpinComplete={onDone}
          isAdmin={isAdmin}
          storedState={storedState}
          classes={classes}
        />
      )}
      {marketType === PLANNING_TYPE && idLoaded === marketId && (
        <PlanningInvestibleAdd
          marketId={marketId}
          onCancel={onDone}
          onSave={onInvestibleSave}
          onSpinComplete={onDone}
          marketPresences={marketPresences}
          storedState={storedState}
          classes={classes}
        />
      )}
    </Screen>
  );
}

InvestibleAdd.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default InvestibleAdd;
