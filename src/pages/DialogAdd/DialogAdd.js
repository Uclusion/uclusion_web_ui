import React, { useContext, useEffect, useState } from 'react'
import { useHistory, useLocation } from 'react-router';
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import localforage from 'localforage'
import queryString from 'query-string'
import Screen from '../../containers/Screen/Screen'
import DecisionAdd from './DecisionAdd'
import PlanningAdd from './PlanningAdd'
import { DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE, } from '../../constants/markets'
import InitiativeAdd from './InitiativeAdd'
import { makeBreadCrumbs, navigate } from '../../utils/marketIdPathFunctions'
import { DiffContext } from '../../contexts/DiffContext/DiffContext'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { addMarket } from '../../contexts/MarketsContext/marketsContextHelper'
import { AccountContext } from '../../contexts/AccountContext/AccountContext'
import { canCreate } from '../../contexts/AccountContext/accountContextHelper'
import { getInlineBreadCrumbs } from '../Investible/Decision/DecisionInvestible'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import UpgradeBanner from '../../components/Banners/UpgradeBanner';

function DialogAdd(props) {
  const { hidden } = props;
  const history = useHistory();
  const location = useLocation();
  const { hash } = location;
  const values = queryString.parse(hash);
  const { type } = values;
  const intl = useIntl();

  const [, diffDispatch] = useContext(DiffContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const [marketState, marketDispatch] = useContext(MarketsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const addTitleName = type === DECISION_TYPE ? 'addDecision' : type === PLANNING_TYPE ? 'addPlanning' : 'addInitiative';
  const [storedState, setStoredState] = useState(undefined);
  const [idLoaded, setIdLoaded] = useState(undefined);
  const [accountState] = useContext(AccountContext);
  const createEnabled = canCreate(accountState);
  const banner = !createEnabled? <UpgradeBanner/> : undefined;

  useEffect(() => {
    if (!hidden) {
      localforage.getItem(`add_market_${type}`).then((stateFromDisk) => {
        setStoredState(stateFromDisk || {});
        setIdLoaded(type);
      });
    }
    if (hidden) {
      setIdLoaded(undefined);
    }
  }, [hidden, type]);

  function onSave(result){
    addMarket(result, marketDispatch, diffDispatch, presenceDispatch);
  }

  function onDone(link) {
    setIdLoaded(undefined);
    return localforage.removeItem(`add_market_${type}`)
      .finally(() => {
        if (link) {
          navigate(history, link);
        } else {
          // This is a cancel
          navigate(history);
        }
      });
  }
  let crumbs = [];
  if (type === DECISION_TYPE) {
    const { investibleId: parentInvestibleId, id: parentMarketId } = values;
    if (parentMarketId) {
      crumbs = getInlineBreadCrumbs(marketState, parentMarketId, parentInvestibleId, investiblesState)
    }
  }
  const breadCrumbs = makeBreadCrumbs(history, crumbs, true);
  return (
    <Screen
      title={intl.formatMessage({ id: addTitleName })}
      tabTitle={intl.formatMessage({ id: addTitleName })}
      hidden={hidden}
      banner={banner}
      breadCrumbs={breadCrumbs}
    >
      {type === PLANNING_TYPE && idLoaded === type && (
        <PlanningAdd onSave={onSave} onSpinStop={onDone} storedState={storedState}
                     createEnabled={createEnabled} />
      )}
      {type === DECISION_TYPE && idLoaded === type && (
        <DecisionAdd onSave={onSave} onSpinStop={onDone} storedState={storedState}
                     createEnabled={createEnabled} />
      )}

      {type === INITIATIVE_TYPE && idLoaded === type && (
        <InitiativeAdd onSave={onSave} onSpinStop={onDone} storedState={storedState}
                       createEnabled={createEnabled} />
      )}
    </Screen>
  );
}

DialogAdd.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default DialogAdd;
