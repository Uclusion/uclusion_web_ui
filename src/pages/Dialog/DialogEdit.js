import React, { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  makeBreadCrumbs, decomposeMarketPath, formMarketLink, navigate,
} from '../../utils/marketIdPathFunctions';
import Screen from '../../containers/Screen/Screen';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getMarket, getMyUserForMarket } from '../../contexts/MarketsContext/marketsContextHelper';
import { DECISION_TYPE, PLANNING_TYPE } from '../../constants/markets';
import PlanningDialogEdit from './Planning/PlanningDialogEdit';
import DecisionDialogEdit from './Decision/DecisionDialogEdit';
import { lockPlanningMarketForEdit, unlockPlanningMarketForEdit } from '../../api/markets';
import localforage from "localforage";

function DialogEdit(props) {
  const { hidden } = props;
  const intl = useIntl();
  const history = useHistory();
  const { location } = history;
  const { pathname } = location;
  const { marketId } = decomposeMarketPath(pathname);
  const [marketsState] = useContext(MarketsContext);
  const renderableMarket = getMarket(marketsState, marketId) || {};
  const { market_type: marketType, locked_by: lockedBy } = renderableMarket;
  const currentMarketName = (renderableMarket && renderableMarket.name) || '';
  const breadCrumbTemplates = [{ name: currentMarketName, link: formMarketLink(marketId) }];
  const myBreadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates, true);
  const editVerbiage = intl.formatMessage({ id: 'edit' });
  const [idLoaded, setIdLoaded] = useState(undefined);
  const [storedDescription, setStoredDescription] = useState(undefined);
  const [lockedMarketId, setLockedMarketId] = useState(undefined);
  const user = getMyUserForMarket(marketsState, marketId) || {};
  const userId = user.id;
  const loading = !user.id || !marketType || idLoaded !== marketId;
  useEffect(() => {
    if (!hidden) {
      if (marketId !== lockedMarketId && marketType === PLANNING_TYPE) {
        // Immediately set to avoid multiple calls
        setLockedMarketId(marketId);
        // for now, just break the lock always
        const breakLock = true;
        lockPlanningMarketForEdit(marketId, breakLock)
          .catch(() => setLockedMarketId(undefined));
      }
      localforage.getItem(marketId).then((description) => {
        setStoredDescription(description || '');
        setIdLoaded(marketId);
      });
    }
    // We need this way otherwise if they navigate out by back button we don't release the lock
    if (hidden && lockedMarketId && marketType === PLANNING_TYPE) {
      const originalLockedId = lockedMarketId;
      // Set right away to avoid multiple calls
      setLockedMarketId(undefined);
      unlockPlanningMarketForEdit(lockedMarketId)
        .then(() => localforage.removeItem(originalLockedId))
        .catch(() => setLockedMarketId(originalLockedId));
    }
  }, [hidden, marketId, lockedMarketId, marketType]);

  function onDone() {
    if (marketType !== PLANNING_TYPE) {
      localforage.removeItem(marketId).then(() => navigate(history, formMarketLink(marketId)));
    } else {
      navigate(history, formMarketLink(marketId));
    }
  }

  function onSave() {
    // Save removes the lock so no need to release
    setLockedMarketId(undefined);
    localforage.removeItem(marketId).then(() => navigate(history, formMarketLink(marketId)));
  }
  const someoneElseEditing = lockedBy && (lockedBy !== userId);
  const warning = someoneElseEditing ? intl.formatMessage({ id: 'edit_lock' }) : undefined;
  return (
    <Screen
      title={editVerbiage}
      hidden={hidden}
      tabTitle={editVerbiage}
      breadCrumbs={myBreadCrumbs}
      warning={warning}
      loading={loading}
    >
      {!hidden && marketType === DECISION_TYPE && idLoaded === marketId && (
        <DecisionDialogEdit
          editToggle={onSave}
          market={renderableMarket}
          onCancel={onDone}
          storedDescription={storedDescription}
        />
      )}
      {!hidden && marketType === PLANNING_TYPE && idLoaded === marketId && (
        <PlanningDialogEdit
          editToggle={onSave}
          market={renderableMarket}
          onCancel={onDone}
          storedDescription={storedDescription}
        />
      )}
    </Screen>
  );
}

DialogEdit.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default DialogEdit;
