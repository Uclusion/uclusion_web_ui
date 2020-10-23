import React, { useContext, useEffect, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import localforage from 'localforage'
import { lockInvestibleForEdit, realeaseInvestibleEditLock, updateInvestible, } from '../../api/investibles'
import { urlHelperGetName } from '../../utils/marketIdPathFunctions'
import { getInvestible, refreshInvestibles, } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { getMarket, getMyUserForMarket, } from '../../contexts/MarketsContext/marketsContextHelper'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { DiffContext } from '../../contexts/DiffContext/DiffContext'
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton'
import clsx from 'clsx'
import { LockedDialog, useLockedDialogStyles } from '../Dialog/DialogEdit'
import { EMPTY_SPIN_RESULT } from '../../constants/global'
import _ from 'lodash'
import QuillEditor from '../../components/TextEditors/QuillEditor'
import { CardActions, TextField } from '@material-ui/core'
import { processTextAndFilesForSave } from '../../api/files'
import { usePlanFormStyles } from '../../components/AgilePlan'
import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles(
  theme => ({
    actions: {
      margin: theme.spacing(9, 0, 0, 0)
    },
  }),
  { name: "PlanningEdit" }
);

function InvestibleBodyEdit (props) {
  const { hidden, marketId, investibleId, setBeingEdited } = props;
  const intl = useIntl();
  const [investiblesState, investiblesDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const inv = getInvestible(investiblesState, investibleId);
  const fullInvestible = inv || { investible: { name: '' } };
  const [marketsState] = useContext(MarketsContext);
  const userId = getMyUserForMarket(marketsState, marketId);
  const { investible: myInvestible } = fullInvestible;
  const { locked_by: lockedBy } = myInvestible;
  const [idLoaded, setIdLoaded] = useState(undefined);
  const [storedState, setStoredState] = useState({});
  const emptyMarket = { name: '' };
  const market = getMarket(marketsState, marketId) || emptyMarket;
  const [lockFailed, setLockFailed] = useState(false);
  const loading = idLoaded !== investibleId || !market || !inv || !userId;
  const someoneElseEditing = !_.isEmpty(lockedBy) && (lockedBy !== userId);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const { description: storedDescription, name: storedName } = storedState;
  const { id, description: initialDescription, name: initialName } = myInvestible;
  const [description, setDescription] = useState(storedDescription || initialDescription);
  const [name, setName] = useState(storedName || initialName);
  const [draftState, setDraftState] = useState(storedState);

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
      if (!loading && !someoneElseEditing && !lockFailed) {
        lockInvestibleForEdit(marketId, investibleId)
          .catch(() => setLockFailed(true));
      }
    }
    return () => {};
  }, [hidden, investibleId, marketId, someoneElseEditing, loading, lockFailed]);

  function handleSave() {
    // uploaded files on edit is the union of the new uploaded files and the old uploaded files
    const oldInvestibleUploadedFiles = myInvestible.uploaded_files || [];
    const newUploadedFiles = _.uniqBy([...uploadedFiles, ...oldInvestibleUploadedFiles], 'path');
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(newUploadedFiles, description);
    const updateInfo = {
      uploadedFiles: filteredUploads,
      name,
      description: tokensRemoved,
      marketId,
      investibleId: id,
    };
    return updateInvestible(updateInfo)
      .then((fullInvestible) => {
        return {
          result: { fullInvestible },
          spinChecker: () => Promise.resolve(true),
        };
      });
  }

  function handleDraftState(newDraftState) {
    setDraftState(newDraftState);
    localforage.setItem(myInvestible.id, newDraftState).then(() => {});
  }

  function onEditorChange(description) {
    setDescription(description);
  }

  function onStorageChange(description) {
    localforage.getItem(id).then((stateFromDisk) => {
      handleDraftState({ ...stateFromDisk, description });
    });
  }

  function handleFileUpload(metadatas) {
    setUploadedFiles(metadatas);
  }

  function onNameChange(event) {
    const { value } = event.target;
    setName(value);
    handleDraftState({ ...draftState, name: value });
  }

  function onCancel() {
    if (_.isEmpty(lockedBy) || (lockedBy !== userId)) {
      setBeingEdited(false);
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
        .finally(() => setBeingEdited(false));
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
      setBeingEdited(false);
    }
  }
  const classes = useStyles();
  const editClasses = usePlanFormStyles();
  const lockedDialogClasses = useLockedDialogStyles();
  if (loading) {
    return React.Fragment;
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
            onClick={takeoutLock}
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
        id="plan-investible-name"
        label={intl.formatMessage({ id: "agilePlanFormTitleLabel" })}
        onChange={onNameChange}
        placeholder={intl.formatMessage({
          id: "storyTitlePlaceholder"
        })}
        value={name}
        variant="filled"
      />
      <QuillEditor
        onS3Upload={handleFileUpload}
        marketId={marketId}
        onChange={onEditorChange}
        placeholder={intl.formatMessage({ id: 'investibleAddDescriptionDefault' })}
        onStoreChange={onStorageChange}
        defaultValue={description}
        setOperationInProgress={setOperationRunning}
        getUrlName={urlHelperGetName(marketsState, investiblesState)}
      />
      <CardActions className={classes.actions}>
        <SpinBlockingButton
          marketId={marketId}
          onClick={onCancel}
          className={editClasses.actionSecondary}
          color="secondary"
          variant="contained"
          hasSpinChecker
        >
          <FormattedMessage
            id={"marketAddCancelLabel"}
          />
        </SpinBlockingButton>
        <SpinBlockingButton
          marketId={marketId}
          variant="contained"
          color="primary"
          className={editClasses.actionPrimary}
          onClick={handleSave}
          disabled={!name}
          onSpinStop={onSave}
          hasSpinChecker
        >
          <FormattedMessage
            id={"agilePlanFormSaveLabel"}
          />
        </SpinBlockingButton>
      </CardActions>
    </>
  );
}

InvestibleBodyEdit.propTypes = {
  hidden: PropTypes.bool,
  marketId: PropTypes.string.isRequired,
  investibleId: PropTypes.string.isRequired,
  setBeingEdited: PropTypes.func.isRequired
};

InvestibleBodyEdit.defaultProps = {
  hidden: false,
};

export default InvestibleBodyEdit;
