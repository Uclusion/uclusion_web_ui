import React, { useContext, useEffect, useState } from 'react'
import { Button, Card, CardActions, CardContent, TextField, } from '@material-ui/core'
import _ from 'lodash'
import localforage from 'localforage'
import PropTypes from 'prop-types'
import { updateInvestible } from '../../../api/investibles'
import QuillEditor from '../../../components/TextEditors/QuillEditor'
import { processTextAndFilesForSave } from '../../../api/files'
import { getMarketInfo } from '../../../utils/userFunctions'
import AssignmentList from '../../Dialog/Planning/AssignmentList'
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import CardType, { ASSIGN_TYPE, STORY_TYPE } from '../../../components/CardType'
import { FormattedMessage, useIntl } from 'react-intl'
import { DaysEstimate, usePlanFormStyles } from '../../../components/AgilePlan'
import BlockIcon from '@material-ui/icons/Block'
import WarningDialog from '../../../components/Warnings/WarningDialog'
import { useLockedDialogStyles } from '../../Dialog/DialogEdit'

function PlanningInvestibleEdit(props) {
  const {
    fullInvestible, onCancel, onSave, marketId, storedState, isAssign,
  } = props;
  const intl = useIntl();
  const classes = usePlanFormStyles();
  const lockedDialogClasses = useLockedDialogStyles();
  const { description: storedDescription, name: storedName, assignments: storedAssignments,
    days_estimate: storedDaysEstimate } = storedState;
  const [draftState, setDraftState] = useState(storedState);
  const myInvestible = fullInvestible.investible;
  const marketInfo = getMarketInfo(fullInvestible, marketId) || {};
  const { assigned: marketAssigned, days_estimate: marketDaysEstimate, created_at: createdAt } = marketInfo;
  const assigned = storedAssignments || marketAssigned;
  const daysEstimatePersisted = storedDaysEstimate || marketDaysEstimate;
  const { id, description: initialDescription, name: initialName } = myInvestible;
  const [currentValues, setCurrentValues] = useState({ ...myInvestible, name: storedName || initialName });
  const [assignments, setAssignments] = useState(assigned);
  const [daysEstimate, setDaysEstimate] = useState(daysEstimatePersisted);
  const [validForm, setValidForm] = useState(true);
  const { name } = currentValues;
  const initialUploadedFiles = myInvestible.uploaded_files || [];
  const [uploadedFiles, setUploadedFiles] = useState(initialUploadedFiles);
  const [description, setDescription] = useState(storedDescription || initialDescription);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [open, setOpen] = useState(false);
  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    // Long form to prevent flicker
    if (name && description && description.length > 0
      && (!isAssign || (Array.isArray(assignments) && assignments.length > 0))) {
      if (!validForm) {
        setValidForm(true);
      }
    } else if (validForm) {
      setValidForm(false);
    }
  }, [name, description, assignments, validForm, isAssign]);

  function handleDraftState(newDraftState) {
    setDraftState(newDraftState);
    localforage.setItem(id, newDraftState);
  }

  function handleChange(field) {
    return (event) => {
      const { value } = event.target;
      const newValues = { ...currentValues, [field]: value };
      setCurrentValues(newValues);
      handleDraftState({ ...draftState, [field]: value });
    };
  }

  function onEditorChange(description) {
    setDescription(description);
  }

  function onStorageChange(description) {
    localforage.getItem(id).then((stateFromDisk) => {
      handleDraftState({ ...stateFromDisk, description });
    });
  }

  function onDaysEstimateChange(event) {
    const { value } = event.target;
    const valueInt = value ? parseInt(value, 10) : null;
    setDaysEstimate(valueInt);
    handleDraftState({ ...draftState, days_estimate: valueInt });
  }

  function handleFileUpload(metadatas) {
    setUploadedFiles(metadatas);
  }

  function handleSave() {
    let updateInfo;
    if (!_.isEqual(assignments, marketAssigned)) {
      updateInfo = {
        marketId,
        investibleId: id,
        assignments,
      };
    } else {
      // uploaded files on edit is the union of the new uploaded files and the old uploaded files
      const oldInvestibleUploadedFiles = myInvestible.uploaded_files || [];
      const newUploadedFiles = [...uploadedFiles, ...oldInvestibleUploadedFiles];
      const {
        uploadedFiles: filteredUploads,
        text: tokensRemoved,
      } = processTextAndFilesForSave(newUploadedFiles, description);
      updateInfo = {
        uploadedFiles: filteredUploads,
        name,
        description: tokensRemoved,
        marketId,
        investibleId: id,
      };
      // changes to assignments should only be sent if they actually changed
      // otherwise we'll generate a spurious version bump due to market info changes
      if (!_.isEqual(daysEstimate, marketDaysEstimate)) {
        updateInfo.daysEstimate = daysEstimate;
      }
    }
    return updateInvestible(updateInfo)
      .then((investible) => {
        return {
          result: { investible, assignments },
          spinChecker: () => Promise.resolve(true),
        };
      });
  }

  function handleAssignmentChange(newAssignments) {
    setAssignments(newAssignments);
    handleDraftState({ ...draftState, assignments: newAssignments });
  }
  const subtype = isAssign ? ASSIGN_TYPE : STORY_TYPE;
  const operationLabel = isAssign ? "investibleAssign" : "investibleDescription";
  return (
    <Card>
      <CardType
        className={classes.cardType}
        label={intl.formatMessage({ id: operationLabel })}
        type={STORY_TYPE}
        subtype={subtype}
      />
      <CardContent className={classes.cardContent}>
        {isAssign && (
          <AssignmentList
            marketId={marketId}
            previouslyAssigned={assigned}
            onChange={handleAssignmentChange}
          />
        )}
        {!isAssign && (
          <>
            <fieldset className={classes.fieldset}>
              <legend>optional</legend>
              <DaysEstimate onChange={onDaysEstimateChange} value={daysEstimate} createdAt={createdAt} />
            </fieldset>
            <TextField
              fullWidth
              id="plan-investible-name"
              label={intl.formatMessage({ id: "agilePlanFormTitleLabel" })}
              onChange={handleChange('name')}
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
            onStoreChange={onStorageChange}
            defaultValue={description}
            setOperationInProgress={setOperationRunning}
          />
        </>
        )}
      </CardContent>
      <CardActions className={classes.actions}>
        {isAssign && (
          <Button
            className={classes.actionSecondary}
            color="secondary"
            variant="contained"
            onClick={onCancel}
          >
            <FormattedMessage
              id={"marketAddCancelLabel"}
            />
          </Button>
        )}
        {!isAssign && (
          <SpinBlockingButton
            marketId={marketId}
            onClick={onCancel}
            className={classes.actionSecondary}
            color="secondary"
            variant="contained"
            hasSpinChecker
          >
            <FormattedMessage
              id={"marketAddCancelLabel"}
            />
          </SpinBlockingButton>
        )}
        {isAssign && (
          <Button
            className={classes.actionPrimary}
            color="primary"
            variant="contained"
            onClick={handleOpen}
          >
            <FormattedMessage
              id={"agilePlanFormSaveLabel"}
            />
          </Button>
        )}
        {isAssign && (
          <WarningDialog
            classes={lockedDialogClasses}
            open={open}
            onClose={handleClose}
            icon={<BlockIcon/>}
            issueWarningId="reassignWarning"
            /* slots */
            actions={
              <SpinBlockingButton
                marketId={marketId}
                variant="contained"
                color="primary"
                className={classes.actionPrimary}
                onClick={handleSave}
                disabled={!validForm}
                onSpinStop={onSave}
                hasSpinChecker
              >
                <FormattedMessage id="issueProceed" />
              </SpinBlockingButton>
            }
          />
        )}
        {!isAssign && (
          <SpinBlockingButton
            marketId={marketId}
            variant="contained"
            color="primary"
            className={classes.actionPrimary}
            onClick={handleSave}
            disabled={!validForm}
            onSpinStop={onSave}
            hasSpinChecker
          >
            <FormattedMessage
              id={"agilePlanFormSaveLabel"}
            />
          </SpinBlockingButton>
        )}
      </CardActions>
    </Card>

  );
}

PlanningInvestibleEdit.propTypes = {
  fullInvestible: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
  storedState: PropTypes.object.isRequired,
  isAssign: PropTypes.bool.isRequired,
};

PlanningInvestibleEdit.defaultProps = {
  onSave: () => {
  },
  onCancel: () => {
  },
};
export default PlanningInvestibleEdit;
