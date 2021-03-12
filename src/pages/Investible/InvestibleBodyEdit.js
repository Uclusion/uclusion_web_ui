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
import { LockedDialog, useLockedDialogStyles } from '../Dialog/DialogBodyEdit'
import { EMPTY_SPIN_RESULT } from '../../constants/global'
import _ from 'lodash'
import QuillEditor from '../../components/TextEditors/QuillEditor'
import { CardActions, CircularProgress, Typography } from '@material-ui/core'
import { processTextAndFilesForSave } from '../../api/files'
import { usePlanFormStyles } from '../../components/AgilePlan'
import { makeStyles } from '@material-ui/core/styles'
import { PLANNING_TYPE } from '../../constants/markets'
import NameField from '../../components/TextFields/NameField'
import { getMarketInfo } from '../../utils/userFunctions'
import { getFullStage } from '../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext'
import { isTinyWindow } from '../../utils/windowUtils'
import DescriptionOrDiff from '../../components/Descriptions/DescriptionOrDiff'

const useStyles = makeStyles(
  theme => ({
    actions: {
      margin: theme.spacing(9, 0, 0, 0)
    },
    title: {
      fontSize: 32,
      fontWeight: "bold",
      lineHeight: "42px",
      paddingBottom: "9px",
      [theme.breakpoints.down("xs")]: {
        fontSize: 25
      }
    },
    titleEditable: {
      fontSize: 32,
      fontWeight: "bold",
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

function InvestibleBodyEdit (props) {
  const { hidden, marketId, investibleId, setBeingEdited, beingEdited, isEditableByUser } = props;
  const intl = useIntl();
  const [investiblesState, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const inv = getInvestible(investiblesState, investibleId);
  const fullInvestible = inv || { investible: { name: '' } };
  const marketInfo = getMarketInfo(fullInvestible, marketId) || {};
  const { assigned, stage: stageId } = marketInfo;
  const stage = getFullStage(marketStagesState, marketId, stageId)
  const [marketsState] = useContext(MarketsContext);
  const userId = getMyUserForMarket(marketsState, marketId);
  const { investible: myInvestible } = fullInvestible;
  const { locked_by: lockedBy, version } = myInvestible;
  const [idLoaded, setIdLoaded] = useState(undefined);
  const emptyMarket = { name: '' };
  const market = getMarket(marketsState, marketId) || emptyMarket;
  const { market_type: marketType } = market;
  const [lockFailed, setLockFailed] = useState(false);
  const loading = !beingEdited || idLoaded !== investibleId || !market || !inv || !userId;
  const someoneElseEditing = !_.isEmpty(lockedBy) && (lockedBy !== userId);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const { id, description: initialDescription, name: initialName } = myInvestible;
  const [description, setDescription] = useState(undefined);
  const [name, setName] = useState(undefined);

  function onLock (result) {
    if (result) {
      setLockFailed(false);
      onSave(result , true);
    } else {
      setLockFailed(true);
    }
  }

  useEffect(() => {
    if (!hidden && idLoaded !== investibleId) {
      localforage.getItem(investibleId).then((stateFromDisk) => {
        const { description: storedDescription, name: storedName } = (stateFromDisk || {});
        if (storedName || storedDescription) {
          setBeingEdited(true);
          setName(storedName || '');
          setDescription(storedDescription || '');
        }
        // Set here to avoid danger of having some other investible name and description in state
        setIdLoaded(investibleId);
      });
    }
    return () => {
      if (hidden) {
        setLockFailed(false);
      }
    };
  }, [hidden, investibleId, idLoaded, marketType, setBeingEdited]);

  const { editable_by_roles: editableByRoles, allows_assignment: allowsAssignment,
    allows_investment: allowsInvestment } = stage;
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

  const calculatedDescription = description === undefined ? initialDescription : description;
  const calculatedName = name === undefined ? initialName : name;

  function handleSave() {
    // uploaded files on edit is the union of the new uploaded files and the old uploaded files
    const oldInvestibleUploadedFiles = myInvestible.uploaded_files || [];
    const newUploadedFiles = _.uniqBy([...uploadedFiles, ...oldInvestibleUploadedFiles], 'path');
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(newUploadedFiles, calculatedDescription);
    const updateInfo = {
      uploadedFiles: filteredUploads,
      name: calculatedName,
      description: tokensRemoved,
      marketId,
      investibleId: id,
    };
    return updateInvestible(updateInfo)
      .then((fullInvestible) => {
        return {
          result: fullInvestible,
          spinChecker: () => Promise.resolve(true),
        };
      });
  }

  function handleDraftState(newDraftState) {
    localforage.setItem(myInvestible.id, newDraftState).then(() => {});
  }

  function onEditorChange(description) {
    setDescription(description);
  }

  function onStorageChange(description) {
    handleDraftState({ name, description });
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
    setName(undefined);
    setDescription(undefined);
    setBeingEdited(false);
    if (!_.isEmpty(lockedBy) && (lockedBy !== userId)) {
      // If its locked by someone else then skip all the below checks
      return localforage.removeItem(investibleId).then(() => EMPTY_SPIN_RESULT);
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
            return EMPTY_SPIN_RESULT;
          });
    } else {
      return localforage.removeItem(investibleId).then(() => EMPTY_SPIN_RESULT);
    }
  }

  function onSave (fullInvestible, stillEditing) {
    setName(undefined);
    setDescription(undefined);
    if (!stillEditing) {
      setBeingEdited(false);
    }
    if (fullInvestible) {
      refreshInvestibles(investiblesDispatch, diffDispatch, [fullInvestible]);
    }
    return localforage.removeItem(investibleId);
  }
  const classes = useStyles();
  const editClasses = usePlanFormStyles();
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
                       description={calculatedDescription}
                       name={calculatedName}/>
            <QuillEditor
              onS3Upload={handleFileUpload}
              marketId={marketId}
              onChange={onEditorChange}
              placeholder={intl.formatMessage({ id: 'investibleAddDescriptionDefault' })}
              onStoreChange={onStorageChange}
              defaultValue={calculatedDescription}
              setOperationInProgress={setOperationRunning}
              getUrlName={urlHelperGetName(marketsState, investiblesState)}
            />
          </>
        )}
        {(lockedBy && (lockedBy !== userId)) && (
          <div align='center'>
            <Typography>{intl.formatMessage({ id: "gettingLockMessage" })}</Typography>
            <CircularProgress type="indeterminate"/>
          </div>
        )}
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
            disabled={!calculatedName}
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
  investibleId: PropTypes.string.isRequired,
  setBeingEdited: PropTypes.func.isRequired,
};

InvestibleBodyEdit.defaultProps = {
  hidden: false,
};

export default InvestibleBodyEdit;
