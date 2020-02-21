import React, { useContext, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl'
import PropTypes from 'prop-types';
import { useHistory } from 'react-router';
import localforage from 'localforage';
import _ from 'lodash';
import {
  lockInvestibleForEdit,
  realeaseInvestibleEditLock,
} from '../../api/investibles';
import {
  decomposeMarketPath, formInvestibleLink,
  formMarketLink,
  makeBreadCrumbs, navigate,
} from '../../utils/marketIdPathFunctions';
import {
  getInvestible, refreshInvestibles,
} from '../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import {
  getMarket,
  getMyUserForMarket,
} from '../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import Screen from '../../containers/Screen/Screen';
import { DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets';
import DecisionInvestibleEdit from './Decision/DecisionInvestibleEdit';
import PlanningInvestibleEdit from './Planning/PlanningInvestibleEdit';
import InitiativeInvestibleEdit from './Initiative/InitiativeInvestibleEdit';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import { DiffContext } from '../../contexts/DiffContext/DiffContext';
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton';
import clsx from 'clsx';
import { LockedDialog, useLockedDialogStyles } from '../Dialog/DialogEdit';

function InvestibleEdit (props) {
  const { hidden } = props;
  const intl = useIntl();
  const history = useHistory();
  const { location } = history;
  const { pathname } = location;
  const { marketId, investibleId } = decomposeMarketPath(pathname);
  const [investiblesState, investiblesDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const inv = getInvestible(investiblesState, investibleId);
  const fullInvestible = inv || { investible: { name: '' } };
  const [marketsState] = useContext(MarketsContext);
  const user = getMyUserForMarket(marketsState, marketId) || {};
  const userId = user.id;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const myPresence = marketPresences && marketPresences.find((presence) => presence.current_user);
  const isAdmin = myPresence && myPresence.is_admin;
  const { investible: myInvestible } = fullInvestible;
  const { name, locked_by: lockedBy } = myInvestible;
  const [lockedInvestibleId, setLockedInvestibleId] = useState(undefined);
  const [idLoaded, setIdLoaded] = useState(undefined);
  const [storedState, setStoredState] = useState(undefined);
  const [lockedInvestibleIdMarketId, setLockedInvestibleIdMarketId] = useState(undefined);
  const emptyMarket = { name: '' };
  const market = getMarket(marketsState, marketId) || emptyMarket;
  const isDecision = market && market.market_type === DECISION_TYPE;
  const isPlanning = market && market.market_type === PLANNING_TYPE;
  const isInitiative = market && market.market_type === INITIATIVE_TYPE;
  const [lockFailed, setLockFailed] = useState(false);
  const loading = idLoaded !== investibleId || !market || !inv;
  const someoneElseEditing = lockedBy && (lockedBy !== userId);
  const [operationRunning] = useContext(OperationInProgressContext);

  function onLock () {
    setLockedInvestibleId(investibleId);
    setLockedInvestibleIdMarketId(marketId);
    setLockFailed(false);
  }

  useEffect(() => {
    if (!hidden) {
      if (investibleId !== lockedInvestibleId && !loading && !someoneElseEditing && !lockFailed) {
        // Immediately set locked investible id to avoid multiple calls
        setLockedInvestibleId(investibleId);
        setLockedInvestibleIdMarketId(marketId);
        lockInvestibleForEdit(marketId, investibleId)
          .catch(() => setLockFailed(true));
      }
      localforage.getItem(investibleId).then((stateFromDisk) => {
        setStoredState(stateFromDisk || {});
        setIdLoaded(investibleId);
      });
    }
    if (hidden && idLoaded) {
      setIdLoaded(undefined);
    }
    if (hidden && !lockedBy && lockedInvestibleId) {
      setLockedInvestibleId(undefined);
    }
    return () => {
      if (hidden) {
        setLockFailed(false);
      }
    };
  }, [
    hidden, lockedInvestibleId, investibleId, marketId, lockedInvestibleIdMarketId,
    lockedBy, someoneElseEditing, loading, lockFailed, idLoaded
  ]);

  function getNewMarketInfo(assignments) {
    const { market_infos: marketInfos } = fullInvestible;
    if (!assignments) {
      return marketInfos;
    }
    const thisMarketInfo = marketInfos.find((info) => info.market_id === marketId);
    if (!thisMarketInfo) {
      return marketInfos;
    }
    const replacementInfo = {
     ...thisMarketInfo,
     assigned: assignments,
    };
    return _.unionBy([replacementInfo], marketInfos, 'market_id');
  }

  function onDone (result) {
    // the edit ony contains the investible data and assignments, not the full market infos
    if (result) {
      const { investible, assignments } = result;
      const newInfos = getNewMarketInfo(assignments);
      const withMarketInfo = {
        market_infos: newInfos,
        investible: {
          ...investible,
          updated_by: userId,
          updated_by_you: true,
        },
      };
      refreshInvestibles(investiblesDispatch, diffDispatch, [withMarketInfo]);
    }
    const originalLockedId = lockedInvestibleId;
    realeaseInvestibleEditLock(lockedInvestibleIdMarketId, lockedInvestibleId)
      .then(() => localforage.removeItem(originalLockedId))
      .catch(() => setLockedInvestibleId(originalLockedId))
      .finally(() => navigate(history, formInvestibleLink(marketId, investibleId)));
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

  function myOnClick () {
    const breakLock = true;
    return lockInvestibleForEdit(marketId, investibleId, breakLock)
      .catch(() => setLockFailed(true));
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
        onClose={onDone}
        /* slots */
        actions={
          <SpinBlockingButton
            className={clsx(lockedDialogClasses.action, lockedDialogClasses.actionEdit)}
            disableFocusRipple
            marketId={marketId}
            onClick={myOnClick}
            onSpinStop={onLock}
            disabled={operationRunning}
          >
            <FormattedMessage id="pageLockEditPage" />
          </SpinBlockingButton>
        }
      />
      {!hidden && isDecision && inv && idLoaded === investibleId && (
        <DecisionInvestibleEdit
          fullInvestible={inv}
          marketId={marketId}
          userId={userId}
          onSave={onDone}
          onCancel={onDone}
          isAdmin={isAdmin}
          storedState={storedState}
        />
      )}
      {!hidden && isPlanning && inv && idLoaded === investibleId && (
        <PlanningInvestibleEdit
          fullInvestible={inv}
          marketId={marketId}
          marketPresences={marketPresences}
          onSave={onDone}
          onCancel={onDone}
          isAdmin={isAdmin}
          storedState={storedState}
        />
      )}
      {!hidden && isInitiative && inv && idLoaded === investibleId && (
        <InitiativeInvestibleEdit
          fullInvestible={inv}
          marketId={marketId}
          marketPresences={marketPresences}
          onSave={onDone}
          onCancel={onDone}
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
