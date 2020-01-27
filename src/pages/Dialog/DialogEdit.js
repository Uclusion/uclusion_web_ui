import React, { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import localforage from 'localforage';
import LockOpenIcon from '@material-ui/icons/LockOpen';
import Modal from '@material-ui/core/Modal';
import { makeStyles } from '@material-ui/core/styles';
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
import { withSpinLock } from '../../components/SpinBlocking/SpinBlockingHOC';
import TooltipIconButton from '../../components/Buttons/TooltipIconButton';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';

const useStyles = makeStyles((theme) => ({
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    position: 'absolute',
    width: 400,
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
  },
}));

function DialogEdit(props) {
  const { hidden } = props;
  const intl = useIntl();
  const classes = useStyles();
  const history = useHistory();
  const { location } = history;
  const { pathname } = location;
  const { marketId } = decomposeMarketPath(pathname);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
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
  const locked = renderableMarket && renderableMarket.locked_by;
  const userId = user.id;
  const loading = !user.id || !marketType || idLoaded !== marketId;
  const [lockFailed, setLockFailed] = useState(false);
  const someoneElseEditing = lockedBy && (lockedBy !== userId);
  const [operationRunning] = useContext(OperationInProgressContext);
  useEffect(() => {
    if (!hidden) {
      if (marketId !== lockedMarketId && marketType === PLANNING_TYPE
        && !loading && !someoneElseEditing && !lockFailed) {
        // Immediately set to avoid multiple calls
        setLockedMarketId(marketId);
        lockPlanningMarketForEdit(marketId)
          .catch(() => setLockedMarketId(undefined));
      }
      localforage.getItem(marketId).then((description) => {
        setStoredDescription(description || '');
        setIdLoaded(marketId);
      });
    }
    const originalLockedId = lockedMarketId;
    // We need this way otherwise if they navigate out by back button we don't release the lock
    if (hidden && lockedMarketId && locked && marketType === PLANNING_TYPE) {
      // Set right away to avoid multiple calls
      setLockedMarketId(undefined);
      unlockPlanningMarketForEdit(originalLockedId)
        .catch(() => setLockedMarketId(originalLockedId))
        .finally(() => localforage.removeItem(originalLockedId));
    }
    if (hidden && !locked && lockedMarketId) {
      setLockedMarketId(undefined);
      localforage.removeItem(originalLockedId);
    }
    return () => {
      if (hidden) {
        setLockFailed(false);
      }
    };
  }, [hidden, marketId, lockedMarketId, marketType, locked, loading,
    lockFailed, someoneElseEditing]);

  function onDone() {
    if (marketType !== PLANNING_TYPE) {
      localforage.removeItem(marketId).finally(() => navigate(history, formMarketLink(marketId)));
    } else {
      navigate(history, formMarketLink(marketId));
    }
  }

  function onSave() {
    localforage.removeItem(marketId).finally(() => navigate(history, formMarketLink(marketId)));
  }
  let lockedByName;
  if (lockedBy) {
    const lockedByPresence = marketPresences.find(
      (presence) => presence.id === lockedBy,
    );
    if (lockedByPresence) {
      const { name } = lockedByPresence;
      lockedByName = name;
    }
  }
  const lockWarning = lockFailed ? intl.formatMessage({ id: 'lockFailedWarning' })
    : intl.formatMessage({ id: 'lockedBy' }, { x: lockedByName });
  const SpinningTooltipIconButton = withSpinLock(TooltipIconButton);
  function myOnClick() {
    const breakLock = true;
    return lockPlanningMarketForEdit(marketId, breakLock)
      .catch(() => setLockFailed(true));
  }
  function onLock() {
    setLockedMarketId(marketId);
    setLockFailed(false);
  }
  return (
    <Screen
      title={editVerbiage}
      hidden={hidden}
      tabTitle={editVerbiage}
      breadCrumbs={myBreadCrumbs}
      loading={loading}
    >
      <Modal
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
        open={!hidden && (someoneElseEditing || lockFailed)}
        className={classes.modal}
        onClose={onDone}
      >
        <div className={classes.paper}>
          <h2 id="simple-modal-title">{intl.formatMessage({ id: 'warning' })}</h2>
          <p id="simple-modal-description">
            {lockWarning}
          </p>
          <SpinningTooltipIconButton
            marketId={marketId}
            onClick={myOnClick}
            onSpinStop={onLock}
            disabled={operationRunning}
            translationId="breakLock"
            icon={<LockOpenIcon />}
          />
        </div>
      </Modal>
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
