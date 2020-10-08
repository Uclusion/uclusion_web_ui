import React, { useContext, useState } from 'react'
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
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { makeStyles } from '@material-ui/core/styles'
import { urlHelperGetName } from '../../../utils/marketIdPathFunctions'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'

export const usePlanInvestibleStyles = makeStyles(
  theme => ({
    fieldset: {
      border: "none",
      margin: theme.spacing(1),
      maxWidth: "400px"
    },
  }),
  { name: "PlanningInvestibleEdit" }
);

function PlanningInvestibleEdit(props) {
  const {
    fullInvestible, onCancel, onSave, marketId, storedState, isAssign,
  } = props;
  const intl = useIntl();
  const classes = usePlanFormStyles();
  const myClasses = usePlanInvestibleStyles();
  const lockedDialogClasses = useLockedDialogStyles();
  const { description: storedDescription, name: storedName, days_estimate: storedDaysEstimate } = storedState;
  const [draftState, setDraftState] = useState(storedState);
  const myInvestible = fullInvestible.investible;
  const marketInfo = getMarketInfo(fullInvestible, marketId) || {};
  const { assigned: marketAssigned, days_estimate: marketDaysEstimate, created_at: createdAt } = marketInfo;
  const daysEstimatePersisted = storedDaysEstimate || marketDaysEstimate;
  const { id, description: initialDescription, name: initialName } = myInvestible;
  const [currentValues, setCurrentValues] = useState({ ...myInvestible, name: storedName || initialName });
  const [assignments, setAssignments] = useState(marketAssigned);
  const [daysEstimate, setDaysEstimate] = useState(daysEstimatePersisted);
  const { name } = currentValues;
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [description, setDescription] = useState(storedDescription || initialDescription);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [open, setOpen] = useState(false);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const [marketState] = useContext(MarketsContext);
  const [investibleState] = useContext(InvestiblesContext);
  const hasVotes = marketPresences.find(presence => {
    const { investments } = presence;
    if (_.isEmpty(investments)) {
      return false;
    }
    let found = false;
    investments.forEach(investment => {
      const { investible_id: invId } = investment;
      if (invId === id) {
        found = true;
      }
    });
    return found;
  });
  const validForm = name && (!isAssign || (Array.isArray(assignments) && assignments.length > 0));

  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

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
    const assignmentChanged = !_.isEmpty(_.xor(assignments, marketAssigned));
    if (assignmentChanged) {
      updateInfo = {
        marketId,
        investibleId: id,
        assignments,
      };
    } else {
      // uploaded files on edit is the union of the new uploaded files and the old uploaded files
      const oldInvestibleUploadedFiles = myInvestible.uploaded_files || [];
      const newUploadedFiles = _.uniqBy([...uploadedFiles, ...oldInvestibleUploadedFiles], 'path');
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
      .then((fullInvestible) => {
        return {
          result: { fullInvestible, assignmentChanged },
          spinChecker: () => Promise.resolve(true),
        };
      });
  }

  function handleAssignmentChange(newAssignments) {
    setAssignments(newAssignments);
  }
  const subtype = isAssign ? ASSIGN_TYPE : STORY_TYPE;
  const operationLabel = isAssign ? "investibleAssign" : "investibleDescription";
  return (
    <Card elevation={0}>
      <CardType
        className={classes.cardType}
        label={intl.formatMessage({ id: operationLabel })}
        type={STORY_TYPE}
        subtype={subtype}
      />
      <CardContent>
        {isAssign && (
          <div className={classes.cardContent}>
            <AssignmentList
              marketId={marketId}
              previouslyAssigned={marketAssigned}
              onChange={handleAssignmentChange}
            />
          </div>
        )}
        {!isAssign && (
          <>
          <div className={classes.cardContent}>
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
            <fieldset className={myClasses.fieldset}>
              <DaysEstimate onChange={onDaysEstimateChange} value={daysEstimate} createdAt={createdAt} />
            </fieldset>
          </div>
          <QuillEditor
            onS3Upload={handleFileUpload}
            marketId={marketId}
            onChange={onEditorChange}
            placeholder={intl.formatMessage({ id: 'investibleAddDescriptionDefault' })}
            onStoreChange={onStorageChange}
            defaultValue={description}
            setOperationInProgress={setOperationRunning}
            getUrlName={urlHelperGetName(marketState, investibleState)}
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
        {isAssign && hasVotes && (
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
        {isAssign && hasVotes && (
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
        {(!isAssign || !hasVotes) && (
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
