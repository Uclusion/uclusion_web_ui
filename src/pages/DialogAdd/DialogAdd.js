import React, { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import localforage from 'localforage';
import queryString from 'query-string';
import Screen from '../../containers/Screen/Screen';
import DecisionAdd from './DecisionAdd';
import PlanningAdd from './PlanningAdd';
import { DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE, } from '../../constants/markets';
import InitiativeAdd from './InitiativeAdd';
import {
  makeBreadCrumbs,
  navigate
} from '../../utils/marketIdPathFunctions';
import { DiffContext } from '../../contexts/DiffContext/DiffContext';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { addMarketToStorage } from '../../contexts/MarketsContext/marketsContextHelper';
import { addPresenceToMarket } from '../../contexts/MarketPresencesContext/marketPresencesHelper';

function DialogAdd(props) {
  const { hidden } = props;
  const history = useHistory();
  const { location } = history;
  const { hash } = location;
  const values = queryString.parse(hash);
  const { type } = values;
  const intl = useIntl();

  const [, diffDispatch] = useContext(DiffContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const [, marketDispatch] = useContext(MarketsContext);

  // eslint-disable-next-line no-nested-ternary
  const addTitleName = type === DECISION_TYPE ? 'addDecision' : type === PLANNING_TYPE ? 'addPlanning' : 'addInitiative';
  const [storedState, setStoredState] = useState(undefined);
  const [idLoaded, setIdLoaded] = useState(undefined);

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
    const {
      market,
      presence,
    } = result;
    const { id: marketId } = market;
    addMarketToStorage(marketDispatch, diffDispatch, market);
    addPresenceToMarket(presenceDispatch, marketId, presence);
  }

  function onDone(link) {
    setIdLoaded(undefined);
    return localforage.removeItem(`add_market_${type}`)
      .finally(() => {
        if (link) {
          navigate(history, link);
        } else {
          // This is a cancel
          navigate(history, '/');
        }
      });
  }

  const breadCrumbs = makeBreadCrumbs(history, [], true);
  return (
    <Screen
      title={intl.formatMessage({ id: addTitleName })}
      tabTitle={intl.formatMessage({ id: addTitleName })}
      hidden={hidden}
      breadCrumbs={breadCrumbs}
    >
      {type === PLANNING_TYPE && idLoaded === type && (
        <PlanningAdd onSave={onSave} onSpinStop={onDone} storedState={storedState}/>
      )}
      {type === DECISION_TYPE && idLoaded === type && (
        <DecisionAdd onSave={onSave} onSpinStop={onDone} storedState={storedState}/>
      )}

      {type === INITIATIVE_TYPE && idLoaded === type && (
        <InitiativeAdd onSave={onSave} onSpinStop={onDone} storedState={storedState}/>
      )}
    </Screen>
  );
}

DialogAdd.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default DialogAdd;
