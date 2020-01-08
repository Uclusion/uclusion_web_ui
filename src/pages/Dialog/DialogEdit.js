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

function InvestibleAdd(props) {
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
  const [lockedMarketId, setLockedMarketId] = useState(undefined);
  const user = getMyUserForMarket(marketsState, marketId) || {};
  const userId = user.id;

  useEffect(() => {
    if (marketType === PLANNING_TYPE) {
      if (!hidden && marketId !== lockedMarketId) {
        // for now, just break the lock always
        const breakLock = true;
        lockPlanningMarketForEdit(marketId, breakLock)
          .then(() => setLockedMarketId(marketId));
      }
      // We need this way otherwise if they navigate out by back button we don't release the lock
      if (hidden && lockedMarketId) {
        unlockPlanningMarketForEdit(lockedMarketId)
          .then(() => setLockedMarketId(undefined));
      }
    }
  }, [hidden, marketId, lockedMarketId, marketType]);

  function onDone() {
    navigate(history, formMarketLink(marketId));
  }

  function onSave() {
    // Save removes the lock so no need to release
    setLockedMarketId(undefined);
    onDone();
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
    >
      {marketType === DECISION_TYPE && (
        <DecisionDialogEdit
          editToggle={onSave}
          market={renderableMarket}
          onCancel={onDone}
        />
      )}
      {marketType === PLANNING_TYPE && (
        <PlanningDialogEdit
          editToggle={onSave}
          market={renderableMarket}
          onCancel={onDone}
        />
      )}
    </Screen>
  );
}

InvestibleAdd.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default InvestibleAdd;
