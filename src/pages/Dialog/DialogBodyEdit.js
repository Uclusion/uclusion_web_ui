import React, { useContext, useEffect, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import localforage from 'localforage'
import Button from '@material-ui/core/Button'
import { darken, makeStyles } from '@material-ui/core/styles'
import LockedDialogTitleIcon from '@material-ui/icons/Lock'
import clsx from 'clsx'
import _ from 'lodash'
import { urlHelperGetName, } from '../../utils/marketIdPathFunctions'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { addMarketToStorage, getMarket, getMyUserForMarket } from '../../contexts/MarketsContext/marketsContextHelper'
import { PLANNING_TYPE } from '../../constants/markets'
import { lockPlanningMarketForEdit, unlockPlanningMarketForEdit, updateMarket } from '../../api/markets'
import { Dialog } from '../../components/Dialogs'
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { DiffContext } from '../../contexts/DiffContext/DiffContext'
import { CardActions, TextField } from '@material-ui/core'
import QuillEditor from '../../components/TextEditors/QuillEditor'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { processTextAndFilesForSave } from '../../api/files'
import { usePlanFormStyles } from '../../components/AgilePlan'

export const useLockedDialogStyles = makeStyles(
  () => {
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

const useStyles = makeStyles(
  theme => ({
    actions: {
      margin: theme.spacing(9, 0, 0, 0)
    },
  }),
  { name: "DialogEdit" }
);

function DialogBodyEdit(props) {
  const { hidden, setBeingEdited, marketId, setLastEdit, lastEdit } = props;
  const [lastIntervalRun, setLastIntervalRun] = useState(undefined);
  const intl = useIntl();
  const editClasses = usePlanFormStyles();
  const classes = useStyles();
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketsState, marketsDispatch] = useContext(MarketsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const renderableMarket = getMarket(marketsState, marketId) || {};
  const { id, name: initialName, description: initialDescription,
    market_type: marketType, locked_by: lockedBy } = renderableMarket;
  const [idLoaded, setIdLoaded] = useState(undefined);
  const userId = getMyUserForMarket(marketsState, marketId) || {};
  const loading = !userId || !marketType || idLoaded !== marketId;
  const [lockFailed, setLockFailed] = useState(false);
  const someoneElseEditing = !_.isEmpty(lockedBy) && (lockedBy !== userId);
  const [operationRunning] = useContext(OperationInProgressContext);
  const [name, setName] = useState(initialName);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [description, setDescription] = useState(initialDescription);

  useEffect(() => {
    if (!hidden) {
      localforage.getItem(marketId).then((stateFromDisk) => {
        const { description: storedDescription, name: storedName } = (stateFromDisk || {});
        if (storedName) {
          if (marketType !== PLANNING_TYPE) {
            setBeingEdited(true);
          }
          setName(storedName);
        }
        if (storedDescription) {
          setDescription(storedDescription);
        }
        setIdLoaded(marketId);
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
  }, [hidden, marketId, idLoaded, setBeingEdited, marketType]);
  
  useEffect(() => {
    if (!hidden) {
      if (marketType === PLANNING_TYPE && !loading && !someoneElseEditing && !lockFailed) {
        lockPlanningMarketForEdit(marketId);
      }
    }
    return () => {};
  }, [hidden, marketType, loading, lockFailed, someoneElseEditing, marketId]);

  useEffect(() => {
    if (lastEdit && lastIntervalRun) {
      const secondsOfDisplay = (lastIntervalRun.getTime() - lastEdit.getTime()) / 1000;
      if (secondsOfDisplay > 3) {
        setLastEdit(undefined);
      }
    }
    return () => {};
  }, [lastEdit, lastIntervalRun, setLastEdit]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastIntervalRun(new Date());
    }, 1000);
    return () => {
      setLastEdit(undefined);
      clearInterval(interval);
    };
  }, [setLastEdit]);

  function handleSave() {
    // the set of files for the market is all the old files, plus our new ones
    const oldMarketUploadedFiles = renderableMarket.uploaded_files || [];
    const newUploadedFiles = _.uniqBy([...uploadedFiles, ...oldMarketUploadedFiles], 'path');
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(newUploadedFiles, description);
    const updatedName = name !== initialName ? name : null;
    const updatedDescription = description !== initialDescription ? tokensRemoved : null;
    const updatedFilteredUploads = _.isEmpty(uploadedFiles) ? filteredUploads : null;
    return updateMarket(id, updatedName, updatedDescription, updatedFilteredUploads, null,
      null, null, null, null)
      .then((market) => {
        return {
          result: market,
          spinChecker: () => Promise.resolve(true),
        };
      });
  }

  function onCancel() {
    if (marketType === PLANNING_TYPE) {
      unlockPlanningMarketForEdit(marketId);
    }
    localforage.removeItem(marketId)
      .finally(() => setBeingEdited(false));
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
    updateMarketInStorage(market);
    return localforage.removeItem(marketId)
      .finally(() => setBeingEdited(false));
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
      updateMarketInStorage(result);
    }
    setLockFailed(!result);
  }

  const lockedDialogClasses = useLockedDialogStyles();

  if (loading) {
    return <React.Fragment/>
  }

  function handleChange(name) {
    return (event) => {
      const { value } = event.target;
      setName(value);
      handleDraftState({ description, [name]: value });
    };
  }

  function handleDraftState(newDraftState) {
    setLastEdit(new Date());
    localforage.setItem(id, newDraftState).then(() => {});
  }

  function onEditorChange(content) {
    setDescription(content);
  }

  function onStorageChange(description) {
    handleDraftState({ name, description });
  }

  function onS3Upload(metadatas) {
    setUploadedFiles(metadatas);
  }

  return (
    <>
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
      <TextField
        fullWidth
        id="decision-name"
        label={intl.formatMessage({ id: "agilePlanFormTitleLabel" })}
        onChange={handleChange('name')}
        placeholder={intl.formatMessage({
          id: "decisionTitlePlaceholder"
        })}
        value={name}
        variant="filled"
      />
      <QuillEditor
        onChange={onEditorChange}
        onStoreChange={onStorageChange}
        defaultValue={description}
        marketId={marketId}
        onS3Upload={onS3Upload}
        setOperationInProgress={setOperationRunning}
        getUrlName={urlHelperGetName(marketsState, investiblesState)}
      />
      <CardActions className={classes.actions}>
        <Button
          onClick={onCancel}
          className={editClasses.actionSecondary}
          color="secondary"
          variant="contained">
          <FormattedMessage
            id="marketAddCancelLabel"
          />
        </Button>
        <SpinBlockingButton
          marketId={id}
          id="save"
          variant="contained"
          color="primary"
          onClick={handleSave}
          onSpinStop={onSave}
          className={editClasses.actionPrimary}
          hasSpinChecker
        >
          <FormattedMessage
            id="agilePlanFormSaveLabel"
          />
        </SpinBlockingButton>
      </CardActions>
    </>
  );
}

DialogBodyEdit.propTypes = {
  hidden: PropTypes.bool.isRequired,
  setBeingEdited: PropTypes.func.isRequired,
  setLastEdit: PropTypes.func.isRequired,
  marketId: PropTypes.string.isRequired,
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

export default DialogBodyEdit;
