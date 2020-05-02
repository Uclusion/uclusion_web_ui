import React, { useContext, useEffect, useState } from 'react'
import { useHistory } from 'react-router'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import localforage from 'localforage'
import { decomposeMarketPath, formMarketLink, makeBreadCrumbs, navigate, } from '../../utils/marketIdPathFunctions'
import Screen from '../../containers/Screen/Screen'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { DECISION_TYPE, PLANNING_TYPE } from '../../constants/markets'
import DecisionInvestibleAdd from './Decision/DecisionInvestibleAdd'
import PlanningInvestibleAdd from './Planning/PlanningInvestibleAdd'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { DiffContext } from '../../contexts/DiffContext/DiffContext'
import { addInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { usePlanFormStyles } from '../../components/AgilePlan'
import queryString from 'query-string'
import { addMinimumVersionRequirement } from '../../contexts/VersionsContext/versionsContextHelper'
import { VersionsContext } from '../../contexts/VersionsContext/VersionsContext'

function InvestibleAdd(props) {
  const { hidden } = props;
  const intl = useIntl();
  const history = useHistory();
  const { location } = history;
  const { pathname, hash } = location;
  const values = queryString.parse(hash || '') || {};
  const { parentInvestibleId } = values;
  const { marketId } = decomposeMarketPath(pathname);
  const [marketsState] = useContext(MarketsContext);
  const [, versionsDispatch] = useContext(VersionsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  // we're going to talk directly to the contexts instead of pushing messages for speed reasons
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const classes = usePlanFormStyles();
  const renderableMarket = getMarket(marketsState, marketId) || {};
  const { market_type: marketType, created_at: createdAt} = renderableMarket;
  const currentMarketName = (renderableMarket && renderableMarket.name) || '';
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const myPresence = marketPresences && marketPresences.find((presence) => presence.current_user);
  const myTruePresence = myPresence || {};
  const { is_admin: isAdmin } = myTruePresence;
  const breadCrumbTemplates = [{ name: currentMarketName, link: formMarketLink(marketId) }];
  const myBreadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates, true);
  const isPlanning = marketType === PLANNING_TYPE && !parentInvestibleId;
  const isDecision = marketType === DECISION_TYPE || parentInvestibleId;
  const titleKey = isPlanning ? 'newStory' : 'newOption';
  const title = intl.formatMessage({ id: titleKey});
  const [storedState, setStoredState] = useState(undefined);
  const [idLoaded, setIdLoaded] = useState(undefined);

  function onInvestibleSave(investible) {
    const { id, version} = investible.investible;
    addMinimumVersionRequirement(versionsDispatch, { id, version});
    addInvestible(investiblesDispatch, diffDispatch, investible);
  }

  const itemKey = `add_investible_${marketId}`;
  function onDone(destinationLink) {
    // console.log(`Called with link ${destinationLink}`);
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

  const loading = idLoaded !== marketId || !marketType || (isDecision && !myPresence);
  return (
    <Screen
      title={title}
      hidden={hidden}
      tabTitle={title}
      breadCrumbs={myBreadCrumbs}
      loading={loading}
    >
      {isDecision && myPresence && idLoaded === marketId && (
        <DecisionInvestibleAdd
          marketId={marketId}
          onSave={onInvestibleSave}
          onCancel={onDone}
          onSpinComplete={onDone}
          isAdmin={isAdmin}
          storedState={storedState}
          classes={classes}
          parentInvestibleId={parentInvestibleId}
        />
      )}
      {isPlanning && idLoaded === marketId && (
        <PlanningInvestibleAdd
          marketId={marketId}
          onCancel={onDone}
          onSave={onInvestibleSave}
          onSpinComplete={onDone}
          marketPresences={marketPresences}
          createdAt={createdAt}
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
