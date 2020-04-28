import React, { useContext, useEffect, useState } from 'react'
import { useHistory } from 'react-router'
import PropTypes from 'prop-types'
import { FormattedMessage, useIntl } from 'react-intl'
import localforage from 'localforage'
import Button from '@material-ui/core/Button'
import { darken, makeStyles } from '@material-ui/core/styles'
import LockedDialogTitleIcon from '@material-ui/icons/Lock'
import clsx from 'clsx'
import _ from 'lodash'
import { decomposeMarketPath, formMarketLink, makeBreadCrumbs, navigate, } from '../../utils/marketIdPathFunctions'
import Screen from '../../containers/Screen/Screen'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { addMarketToStorage, getMarket, getMyUserForMarket } from '../../contexts/MarketsContext/marketsContextHelper'
import { DECISION_TYPE, PLANNING_TYPE } from '../../constants/markets'
import PlanningDialogEdit from './Planning/PlanningDialogEdit'
import DecisionDialogEdit from './Decision/DecisionDialogEdit'
import { lockPlanningMarketForEdit, unlockPlanningMarketForEdit } from '../../api/markets'
import { Dialog } from '../../components/Dialogs'
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { DiffContext } from '../../contexts/DiffContext/DiffContext'
import { VersionsContext } from '../../contexts/VersionsContext/VersionsContext';
import { addVersionRequirement } from '../../contexts/VersionsContext/versionsContextReducer';

export const useLockedDialogStyles = makeStyles(
  theme => {
    return {
      title: {
        backgroundColor: "#F2C94C",
        fontWeight: 'bold',
        textTransform: "capitalize",
        "& h2": {
          display: "flex",
          alignItems: "center"
        }
      },
      titleIcon: {
        height: 16,
        width: 16,
        marginRight: 8,
      },
      warningTitleIcon: {
        marginRight: 8,
      },
      content: {
        lineHeight: 1.75,
        textAlign: "center"
      },
      issueWarningContent: {
        lineHeight: 3,
        textAlign: "center"
      },
      actions: {
        backgroundColor: "#F2F2F2",
        flexBasis: "unset",
        justifyContent: "center"
      },
      action: {
        color: 'white',
        fontWeight: 'bold',
        paddingLeft: 24,
        paddingRight: 24,
        textTransform: "capitalize"
      },
      actionEdit: {
        backgroundColor: "#2D9CDB",
        "&:hover": {
          backgroundColor: darken("#2D9CDB", 0.08)
        },
        "&:focus": {
          backgroundColor: darken("#2D9CDB", 0.24)
        },
      },
      actionCancel: {
        backgroundColor: "#8C8C8C",
        "&:hover": {
          backgroundColor: darken("#8C8C8C", 0.04)
        },
        "&:focus": {
          backgroundColor: darken("#8C8C8C", 0.12)
        },
      }
    };
  },
  { name: "LockedDialog" }
);

function DialogEdit(props) {
  const { hidden } = props;
  const intl = useIntl();
  const history = useHistory();
  const { location } = history;
  const { pathname } = location;
  const { marketId } = decomposeMarketPath(pathname);
  const [marketsState, marketsDispatch] = useContext(MarketsContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, versionsDispatch] = useContext(VersionsContext);
  const renderableMarket = getMarket(marketsState, marketId) || {};
  const { market_type: marketType, locked_by: lockedBy } = renderableMarket;
  const currentMarketName = (renderableMarket && renderableMarket.name) || '';
  const breadCrumbTemplates = [{ name: currentMarketName, link: formMarketLink(marketId) }];
  const myBreadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates, true);
  const editVerbiage = intl.formatMessage({ id: 'edit' });
  const [idLoaded, setIdLoaded] = useState(undefined);
  const [storedState, setStoredState] = useState(undefined);
  const [lockedMarketId, setLockedMarketId] = useState(undefined);
  const userId = getMyUserForMarket(marketsState, marketId) || {};
  const locked = renderableMarket && renderableMarket.locked_by;
  const loading = !userId || !marketType || idLoaded !== marketId;
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
      localforage.getItem(marketId).then((stateFromDisk) => {
        setStoredState(stateFromDisk || {});
        setIdLoaded(marketId);
      });
    }
    if (hidden && idLoaded) {
      setIdLoaded(undefined);
    }
    if (hidden && !locked && lockedMarketId) {
      setLockedMarketId(undefined);
    }
    return () => {
      if (hidden) {
        setLockFailed(false);
      }
    };
  }, [hidden, marketId, lockedMarketId, marketType, locked, loading, idLoaded,
    lockFailed, someoneElseEditing]);

  function onCancel() {
    if (marketType === PLANNING_TYPE) {
      setLockedMarketId(undefined);
      unlockPlanningMarketForEdit(marketId)
        .catch(() => setLockedMarketId(marketId))
    }
    localforage.removeItem(marketId)
      .finally(() => navigate(history, formMarketLink(marketId)));
  }

  function updateMarketInStorage(market) {
    const diffSafe = {
      ...market,
      updated_by: userId,
      updated_by_you: true,
    };
    addMarketToStorage(marketsDispatch, diffDispatch, diffSafe);
  }

  function onSave(market) {
    addVersionRequirement(versionsDispatch, {id: market.id, version: market.version});
    updateMarketInStorage(market);
    return localforage.removeItem(marketId)
      .finally(() => {
        navigate(history, formMarketLink(marketId))
      });
  }
  function myOnClick() {
    const breakLock = true;
    return lockPlanningMarketForEdit(marketId, breakLock)
      .then((result) => {
        return {
          result,
          spinChecker: () => Promise.resolve(true),
        };
      })
      .catch(() => {
        return {
          result: false,
          spinChecker: () => Promise.resolve(true),
        };
      });
  }
  function onLock(result) {
    if (result) {
      setLockedMarketId(marketId);
      updateMarketInStorage(result);
    }
    setLockFailed(!result);
  }

  const lockedDialogClasses = useLockedDialogStyles();

  if (_.isEmpty(marketId)) {
    return <React.Fragment/>
  }

  return (
    <Screen
      title={editVerbiage}
      hidden={hidden}
      tabTitle={editVerbiage}
      breadCrumbs={myBreadCrumbs}
      loading={loading}
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
            onClick={myOnClick}
            onSpinStop={onLock}
            hasSpinChecker
            disabled={operationRunning}
          >
            <FormattedMessage id="pageLockEditPage" />
          </SpinBlockingButton>
        }
      />
      {!hidden && marketType === DECISION_TYPE && idLoaded === marketId && (
        <DecisionDialogEdit
          onSpinStop={onSave}
          market={renderableMarket}
          onCancel={onCancel}
          storedState={storedState}
        />
      )}
      {!hidden && marketType === PLANNING_TYPE && idLoaded === marketId && (
        <PlanningDialogEdit
          onSpinStop={onSave}
          market={renderableMarket}
          onCancel={onCancel}
          storedState={storedState}
        />
      )}
    </Screen>
  );
}

DialogEdit.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export function LockedDialog(props) {
  const { actions, classes, open, onClose } = props;

  const autoFocusRef = React.useRef(null);

  return (
    <Dialog
      autoFocusRef={autoFocusRef}
      classes={{
        root: classes.root,
        actions: classes.actions,
        content: classes.contet,
        title: classes.title
      }}
      open={open}
      onClose={onClose}
      /* slots */
      actions={
        <React.Fragment>
          {actions}
          <Button
            className={clsx(classes.action, classes.actionCancel)}
            disableFocusRipple
            onClick={onClose}
            ref={autoFocusRef}
          >
            <FormattedMessage id="lockDialogCancel" />
          </Button>
        </React.Fragment>
      }
      content={<FormattedMessage id="lockDialogContent" />}
      title={
        <React.Fragment>
          <LockedDialogTitleIcon className={classes.titleIcon} />
          <FormattedMessage id="lockDialogTitle" />
        </React.Fragment>
      }
    />
  );
}

LockedDialog.propTypes = {
  actions: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired
};

export default DialogEdit;
