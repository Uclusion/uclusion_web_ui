import React, { useContext, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router';
import localforage from 'localforage';
import LockOpenIcon from '@material-ui/icons/LockOpen';
import Modal from '@material-ui/core/Modal';
import { makeStyles } from '@material-ui/core/styles';
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
import { withSpinLock } from '../../components/SpinBlocking/SpinBlockingHOC';
import TooltipIconButton from '../../components/Buttons/TooltipIconButton';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import { DiffContext } from '../../contexts/DiffContext/DiffContext';

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

function InvestibleEdit (props) {
  const { hidden } = props;
  const intl = useIntl();
  const classes = useStyles();
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
  const [storedDescription, setStoredDescription] = useState(undefined);
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
      localforage.getItem(investibleId).then((description) => {
        setStoredDescription(description || '');
        setIdLoaded(investibleId);
      });
    }
    // We need this way otherwise if they navigate out by back button we don't release the lock
    if (hidden && lockedBy && lockedInvestibleId) {
      const originalLockedId = lockedInvestibleId;
      // Set right away to avoid multiple calls
      setLockedInvestibleId(undefined);
      realeaseInvestibleEditLock(lockedInvestibleIdMarketId, lockedInvestibleId)
        .then(() => localforage.removeItem(originalLockedId))
        .catch(() => setLockedInvestibleId(originalLockedId));
    }
    return () => {
      if (hidden) {
        setStoredDescription(undefined);
        setLockFailed(false);
      }
    };
  }, [
    hidden, lockedInvestibleId, investibleId, marketId, lockedInvestibleIdMarketId,
    lockedBy, someoneElseEditing, loading, lockFailed
  ]);

  function onDone (investible) {
    // the edit ony updates the investible data, not the market infos
    if (investible) {
      const withMarketInfo = {
        ...fullInvestible,
        investible: {
          ...investible,
          updated_by: userId,
        },
      };
      refreshInvestibles(investiblesDispatch, diffDispatch, [withMarketInfo]);
    }
    navigate(history, formInvestibleLink(marketId, investibleId));
  }

  const { name: marketName } = market;
  const breadCrumbTemplates = [{ name, link: formInvestibleLink(marketId, investibleId) }];
  if (!isInitiative) {
    breadCrumbTemplates.unshift({ name: marketName, link: formMarketLink(marketId) });
  }
  const breadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates, true);
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
            icon={<LockOpenIcon/>}
          />
        </div>
      </Modal>
      {!hidden && isDecision && inv && idLoaded === investibleId && (
        <DecisionInvestibleEdit
          fullInvestible={inv}
          marketId={marketId}
          userId={userId}
          onSave={onDone}
          onCancel={onDone}
          isAdmin={isAdmin}
          storedDescription={storedDescription}
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
          storedDescription={storedDescription}
        />
      )}
      {!hidden && isInitiative && inv && idLoaded === investibleId && (
        <InitiativeInvestibleEdit
          fullInvestible={inv}
          marketId={marketId}
          marketPresences={marketPresences}
          onSave={onDone}
          onCancel={onDone}
          storedDescription={storedDescription}
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
