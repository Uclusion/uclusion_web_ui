import React, { useContext, useEffect, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import { useHistory, useLocation } from 'react-router'
import localforage from 'localforage'
import { lockInvestibleForEdit, realeaseInvestibleEditLock, } from '../../api/investibles'
import {
  decomposeMarketPath,
  formInvestibleLink,
  formMarketLink,
  makeBreadCrumbs,
  navigate,
} from '../../utils/marketIdPathFunctions'
import { getInvestible, refreshInvestibles, } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { getMarket, getMyUserForMarket, } from '../../contexts/MarketsContext/marketsContextHelper'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import Screen from '../../containers/Screen/Screen'
import { DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets'
import DecisionInvestibleEdit from './Decision/DecisionInvestibleEdit'
import PlanningInvestibleEdit from './Planning/PlanningInvestibleEdit'
import InitiativeInvestibleEdit from './Initiative/InitiativeInvestibleEdit'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { DiffContext } from '../../contexts/DiffContext/DiffContext'
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton'
import clsx from 'clsx'
import { LockedDialog, useLockedDialogStyles } from '../Dialog/DialogEdit'
import queryString from 'query-string'
import { EMPTY_SPIN_RESULT } from '../../constants/global'
import _ from 'lodash'

function InvestibleEdit (props) {
  const { hidden } = props;
  const intl = useIntl();
  const history = useHistory();
  const location = useLocation();
  const { pathname, hash } = location;
  const values = queryString.parse(hash || '') || {};
  const { assign } = values;
  const isAssign = assign === 'true';
  const { marketId, investibleId } = decomposeMarketPath(pathname);
  const [investiblesState, investiblesDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const inv = getInvestible(investiblesState, investibleId);
  const fullInvestible = inv || { investible: { name: '' } };
  const [marketsState] = useContext(MarketsContext);
  const userId = getMyUserForMarket(marketsState, marketId);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const myPresence = marketPresences && marketPresences.find((presence) => presence.current_user);
  const isAdmin = myPresence && myPresence.is_admin;
  const { investible: myInvestible } = fullInvestible;
  const { name, locked_by: lockedBy } = myInvestible;
  const [idLoaded, setIdLoaded] = useState(undefined);
  const [storedState, setStoredState] = useState(undefined);
  const emptyMarket = { name: '' };
  const market = getMarket(marketsState, marketId) || emptyMarket;
  const isDecision = market && market.market_type === DECISION_TYPE;
  const isPlanning = market && market.market_type === PLANNING_TYPE;
  const isInitiative = market && market.market_type === INITIATIVE_TYPE;
  const [lockFailed, setLockFailed] = useState(false);
  const loading = idLoaded !== investibleId || !market || !inv || !userId;
  const someoneElseEditing = !_.isEmpty(lockedBy) && (lockedBy !== userId);
  const [operationRunning] = useContext(OperationInProgressContext);

  function onLock (result) {
    if (result) {
      setLockFailed(false);
      onSave({ investible: result } , true);
    } else {
      setLockFailed(true);
    }
  }

  useEffect(() => {
    if (!hidden) {
      localforage.getItem(investibleId).then((stateFromDisk) => {
        setStoredState(stateFromDisk || {});
        setIdLoaded(investibleId);
      });
    }
    if (hidden && idLoaded) {
      setIdLoaded(undefined);
    }
    return () => {
      if (hidden) {
        setLockFailed(false);
      }
    };
  }, [hidden, investibleId, idLoaded]);

  useEffect(() => {
    if (!hidden) {
      if (!isAssign && !loading && !someoneElseEditing && !lockFailed) {
        lockInvestibleForEdit(marketId, investibleId)
          .catch(() => setLockFailed(true));
      }
    }
    return () => {};
  }, [hidden, investibleId, marketId, isAssign, someoneElseEditing, loading, lockFailed]);

  function onCancel() {
    if (_.isEmpty(lockedBy) || (lockedBy !== userId)) {
      navigate(history, formInvestibleLink(marketId, investibleId));
    } else {
      return localforage.removeItem(investibleId)
        .then(() => {
          if (!lockFailed) {
            return realeaseInvestibleEditLock(marketId, investibleId);
          }
          return true;
        })
        .then(() => {
          const newInvestible = {
            ...myInvestible,
            locked_by: undefined,
            locked_at: undefined,
          };
          const newInv = {
            ...inv,
            investible: newInvestible
          };
          refreshInvestibles(investiblesDispatch, diffDispatch, [newInv]);
          return EMPTY_SPIN_RESULT;
        })
        .finally(() => navigate(history, formInvestibleLink(marketId, investibleId)));
    }
  }

  function onSave (result, stillEditing) {
    // the edit ony contains the investible data and assignments, not the full market infos
    if (result) {
      const { fullInvestible} = result;
      localforage.removeItem(investibleId)
        .then(() => {
          refreshInvestibles(investiblesDispatch, diffDispatch, [fullInvestible]);
        });
    }
    if (!stillEditing) {
      navigate(history, formInvestibleLink(marketId, investibleId));
    }
  }

  const { name: marketName } = market;
  const breadCrumbTemplates = [{ name, link: formInvestibleLink(marketId, investibleId) }];
  if (!isInitiative) {
    breadCrumbTemplates.unshift({ name: marketName, link: formMarketLink(marketId) });
  }
  const breadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates, true);
  const lockedDialogClasses = useLockedDialogStyles();
  if (loading) {
    return (
      <Screen
        title={name}
        tabTitle={name}
        breadCrumbs={breadCrumbs}
        hidden={hidden}
        loading
      >
        <div/>
      </Screen>
    );
  }

  function takeoutLock () {
    const breakLock = true;
    return lockInvestibleForEdit(marketId, investibleId, breakLock)
      .then((result) => {
        return {
          result,
          spinChecker: () => Promise.resolve(true),
        }
      }).catch(() => {
        return {
          result: false,
          spinChecker: () => Promise.resolve(true),
        };
      });
  }
  return (
    <Screen
      title={intl.formatMessage({ id: 'edit' })}
      tabTitle={name}
      breadCrumbs={breadCrumbs}
      hidden={hidden}
    >
      <LockedDialog
        classes={lockedDialogClasses}
        open={!hidden && (someoneElseEditing || lockFailed)}
        onClose={onCancel}
        /* slots */
        actions={
          <SpinBlockingButton
            className={clsx(lockedDialogClasses.action, lockedDialogClasses.actionEdit)}
            disableFocusRipple
            marketId={marketId}
            onClick={takeoutLock}
            onSpinStop={onLock}
            hasSpinChecker
            disabled={operationRunning}
          >
            <FormattedMessage id="pageLockEditPage" />
          </SpinBlockingButton>
        }
      />
      {!hidden && isDecision && inv && idLoaded === investibleId && userId && (
        <DecisionInvestibleEdit
          fullInvestible={inv}
          marketId={marketId}
          userId={userId}
          onSave={onSave}
          onCancel={onCancel}
          isAdmin={isAdmin}
          storedState={storedState}
        />
      )}
      {!hidden && isPlanning && inv && idLoaded === investibleId && (
        <PlanningInvestibleEdit
          fullInvestible={inv}
          marketId={marketId}
          marketPresences={marketPresences}
          onSave={onSave}
          onCancel={onCancel}
          isAdmin={isAdmin}
          storedState={storedState}
          isAssign={isAssign}
        />
      )}
      {!hidden && isInitiative && inv && idLoaded === investibleId && (
        <InitiativeInvestibleEdit
          fullInvestible={inv}
          marketId={marketId}
          marketPresences={marketPresences}
          onSave={onSave}
          onCancel={onCancel}
          storedState={storedState}
        />
      )}
    </Screen>
  );
}

InvestibleEdit.propTypes = {
  hidden: PropTypes.bool,
};

InvestibleEdit.defaultProps = {
  hidden: false,
};

export default InvestibleEdit;
