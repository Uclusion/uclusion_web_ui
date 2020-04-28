import React, { useContext, useEffect, useState } from 'react'
import { useHistory } from 'react-router'
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
import { addMarketToStorage } from '../../contexts/MarketsContext/marketsContextHelper'
import { addPresenceToMarket } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { AccountContext } from '../../contexts/AccountContext/AccountContext'
import { canCreate, getAccount } from '../../contexts/AccountContext/accountContextHelper'
import config from '../../config'
import { SUBSCRIPTION_STATUS_CANCELED } from '../../constants/billing'
import { addVersionRequirement } from '../../contexts/VersionsContext/versionsContextReducer';
import { VersionsContext } from '../../contexts/VersionsContext/VersionsContext';

function DialogAdd(props) {
  const { hidden } = props;
  const history = useHistory();
  const { location } = history;
  const { hash } = location;
  const values = queryString.parse(hash);
  const { type } = values;
  const intl = useIntl();

  const [, diffDispatch] = useContext(DiffContext);
  const [, versionsDispatch] = useContext(VersionsContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const [, marketDispatch] = useContext(MarketsContext);
  const addTitleName = type === DECISION_TYPE ? 'addDecision' : type === PLANNING_TYPE ? 'addPlanning' : 'addInitiative';
  const [storedState, setStoredState] = useState(undefined);
  const [idLoaded, setIdLoaded] = useState(undefined);
  const [accountState] = useContext(AccountContext);
  const accountCanCreate = canCreate(accountState);
  const createEnabled = !config.payments.enabled || accountCanCreate;
  const { billing_subscription_status: subStatus } = getAccount(accountState);
  const billingDismissText = subStatus === SUBSCRIPTION_STATUS_CANCELED ? 'billingMustPay' : 'billingStartSubscription';

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
    const { id: marketId, version } = market;
    addVersionRequirement(versionsDispatch, {id: marketId, version});
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
          navigate(history);
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
        <PlanningAdd onSave={onSave} onSpinStop={onDone} storedState={storedState}
                     createEnabled={createEnabled} billingDismissText={billingDismissText}/>
      )}
      {type === DECISION_TYPE && idLoaded === type && (
        <DecisionAdd onSave={onSave} onSpinStop={onDone} storedState={storedState}
                     createEnabled={createEnabled} billingDismissText={billingDismissText}/>
      )}

      {type === INITIATIVE_TYPE && idLoaded === type && (
        <InitiativeAdd onSave={onSave} onSpinStop={onDone} storedState={storedState}
                       createEnabled={createEnabled} billingDismissText={billingDismissText}/>
      )}
    </Screen>
  );
}

DialogAdd.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default DialogAdd;
