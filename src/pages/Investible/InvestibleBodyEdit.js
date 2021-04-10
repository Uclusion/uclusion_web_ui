import React, { useContext, useEffect, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import localforage from 'localforage'
import { lockInvestibleForEdit, realeaseInvestibleEditLock, updateInvestible, } from '../../api/investibles'
import { refreshInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { DiffContext } from '../../contexts/DiffContext/DiffContext'
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton'
import clsx from 'clsx'
import { LockedDialog, useLockedDialogStyles } from '../Dialog/DialogBodyEdit'
import _ from 'lodash'
import { CardActions, CircularProgress, Typography } from '@material-ui/core'
import { processTextAndFilesForSave } from '../../api/files'
import { makeStyles } from '@material-ui/core/styles'
import { PLANNING_TYPE } from '../../constants/markets'
import NameField from '../../components/TextFields/NameField'
import { getMarketInfo } from '../../utils/userFunctions'
import { getFullStage } from '../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext'
import { isTinyWindow } from '../../utils/windowUtils'
import DescriptionOrDiff from '../../components/Descriptions/DescriptionOrDiff'
import { Clear, SettingsBackupRestore } from '@material-ui/icons'
import SpinningIconLabelButton from '../../components/Buttons/SpinningIconLabelButton'
import { editorReset, useEditor } from '../../components/TextEditors/quillHooks';

const useStyles = makeStyles(
  theme => ({
    actions: {
      margin: theme.spacing(9, 0, 0, 0)
    },
    title: {
      fontSize: 32,
      lineHeight: "42px",
      paddingBottom: "9px",
      [theme.breakpoints.down("xs")]: {
        fontSize: 25
      }
    },
    titleEditable: {
      fontSize: 32,
      lineHeight: "42px",
      paddingBottom: "9px",
      cursor: "url('/images/edit_cursor.svg') 0 24, pointer",
      [theme.breakpoints.down("xs")]: {
        fontSize: 25
      }
    },
  }),
  { name: "PlanningEdit" }
);

function InvestibleBodyEdit(props) {
  const { hidden, marketId, investibleId, setBeingEdited, beingEdited, isEditableByUser, loaded, userId,
    fullInvestible } = props;
  const { description: storedDescription, name: storedName } = loaded || {};
  const intl = useIntl();
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const marketInfo = getMarketInfo(fullInvestible, marketId) || {};
  const { assigned, stage: stageId } = marketInfo;
  const stage = getFullStage(marketStagesState, marketId, stageId)
  const [marketsState] = useContext(MarketsContext);
  const { investible: myInvestible } = fullInvestible;
  const { locked_by: lockedBy } = myInvestible;
  const emptyMarket = { name: '' };
  const market = getMarket(marketsState, marketId) || emptyMarket;
  const { market_type: marketType } = market;
  const [lockFailed, setLockFailed] = useState(false);
  const loading = !beingEdited || !market;
  const someoneElseEditing = !_.isEmpty(lockedBy) && (lockedBy !== userId);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const { id, description: initialDescription, name: initialName } = myInvestible;
  const [description, setDescription] = useState(storedDescription);
  const [name, setName] = useState(loaded !== undefined ? storedName : initialName);

  function onLock (result) {
    if (result) {
      setLockFailed(false);
      onSave(result , true);
    } else {
      setLockFailed(true);
    }
  }

  const { editable_by_roles: editableByRoles, allows_assignment: allowsAssignment,
    allows_investment: allowsInvestment } = stage || {};
  const isEditable = beingEdited && (_.size(editableByRoles) > 1 ||
    (marketType === PLANNING_TYPE && (_.size(assigned) > 1 || !allowsAssignment || allowsInvestment)));

  useEffect(() => {
    if (!hidden && !loading && !lockFailed && _.isEmpty(lockedBy) && isEditable) {
      lockInvestibleForEdit(marketId, investibleId)
        .then((newInv) => refreshInvestibles(investiblesDispatch, diffDispatch, [newInv]))
        .catch(() => setLockFailed(true));
    }
    return () => {};
  }, [diffDispatch, hidden, investibleId, investiblesDispatch, isEditable, loading, lockFailed, lockedBy,
    marketId]);

  const editorName = `${marketId}-${investibleId}-body-editor`;
  const editorSpec = {
    onUpload: handleFileUpload,
    marketId,
    onChange: onEditorChange,
    placeholder: intl.formatMessage({ id: 'investibleAddDescriptionDefault' }),
    value: description,
  };

  const [Editor, editorController] = useEditor(editorName, editorSpec);

  function handleSave() {
    setOperationRunning(true);
    // uploaded files on edit is the union of the new uploaded files and the old uploaded files
    const oldInvestibleUploadedFiles = myInvestible.uploaded_files || [];
    const newUploadedFiles = _.uniqBy([...uploadedFiles, ...oldInvestibleUploadedFiles], 'path');
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(newUploadedFiles, description);
    const updateInfo = {
      uploadedFiles: filteredUploads,
      name: name,
      description: tokensRemoved,
      marketId,
      investibleId: id,
    };
    return updateInvestible(updateInfo)
      .then((fullInvestible) => {
        setOperationRunning(false);
        editorController(editorReset());
        onSave(fullInvestible);
      });
  }

  function handleDraftState(newDraftState) {
    localforage.setItem(myInvestible.id, newDraftState).then(() => {});
  }

  function onEditorChange(description) {
    setDescription(description);
  }

  function handleFileUpload(metadatas) {
    setUploadedFiles(metadatas);
  }

  function handleNameChange(value) {
    setName(value);
  }

  function handleNameStorage(value) {
    handleDraftState({ description, name: value });
  }

  function onCancel() {
    setBeingEdited(false);
    editorController(editorReset());
    if (!_.isEmpty(lockedBy) && (lockedBy !== userId)) {
      // If its locked by someone else then skip all the below checks
      return localforage.removeItem(investibleId);
    } else if (isEditable) {
        return localforage.removeItem(investibleId)
          .then(() => {
            if (!lockFailed) {
              return realeaseInvestibleEditLock(marketId, investibleId);
            }
            return fullInvestible;
          })
          .then((newInv) => {
            refreshInvestibles(investiblesDispatch, diffDispatch, [newInv]);
          });
    } else {
      return localforage.removeItem(investibleId);
    }
  }

  function onSave (fullInvestible, stillEditing) {
    if (!stillEditing) {
      setBeingEdited(false);
    }
    if (fullInvestible) {
      refreshInvestibles(investiblesDispatch, diffDispatch, [fullInvestible]);
    }
    return localforage.removeItem(investibleId);
  }
  const classes = useStyles();
  const lockedDialogClasses = useLockedDialogStyles();

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
  if (!hidden && beingEdited && !loading) {
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
              <FormattedMessage id="pageLockEditPage"/>
            </SpinBlockingButton>
          }
        />
        {(!lockedBy || (lockedBy === userId)) && (
          <>
            <NameField onEditorChange={handleNameChange} onStorageChange={handleNameStorage}
                       description={description}
                       name={name}/>
            {Editor}
          </>
        )}
        {(lockedBy && (lockedBy !== userId)) && (
          <div align='center'>
            <Typography>{intl.formatMessage({ id: "gettingLockMessage" })}</Typography>
            <CircularProgress type="indeterminate"/>
          </div>
        )}
        <CardActions className={classes.actions}>
          <SpinningIconLabelButton onClick={onCancel} doSpin={false} icon={Clear}>
            {intl.formatMessage({ id: 'marketAddCancelLabel' })}
          </SpinningIconLabelButton>
          <SpinningIconLabelButton
            disabled={!name}
            icon={SettingsBackupRestore}
            onClick={handleSave}
          >
            <FormattedMessage
              id="agilePlanFormSaveLabel"
            />
          </SpinningIconLabelButton>
        </CardActions>
      </>
    );
  }
  return (
    <>
      <Typography className={isEditableByUser() ? classes.titleEditable : classes.title} variant="h3" component="h1"
                  onClick={() => !isTinyWindow() && setBeingEdited(true)}>
        {initialName}
      </Typography>
      <DescriptionOrDiff id={investibleId} description={initialDescription}
                         setBeingEdited={isTinyWindow() ? () => {} : setBeingEdited}
                         isEditable={isEditableByUser()} />
    </>
  );
}

InvestibleBodyEdit.propTypes = {
  hidden: PropTypes.bool,
  marketId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  investibleId: PropTypes.string.isRequired,
  setBeingEdited: PropTypes.func.isRequired,
  fullInvestible: PropTypes.object.isRequired
};

InvestibleBodyEdit.defaultProps = {
  hidden: false,
};

export default InvestibleBodyEdit;
