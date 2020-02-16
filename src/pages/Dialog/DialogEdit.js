import React, { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';
import localforage from 'localforage';
import Button from '@material-ui/core/Button';
import { darken, makeStyles } from '@material-ui/core/styles';
import LockedDialogTitleIcon from '@material-ui/icons/Lock';
import clsx from 'clsx';
import _ from 'lodash';
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
import { Dialog } from '../../components/Dialogs'
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';

const useLockedDialogStyles = makeStyles(
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
      content: {
        lineHeight: 1.75,
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
  function myOnClick() {
    const breakLock = true;
    return lockPlanningMarketForEdit(marketId, breakLock)
      .catch(() => setLockFailed(true));
  }
  function onLock() {
    setLockedMarketId(marketId);
    setLockFailed(false);
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

function LockedDialog(props) {
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
