import React, { useContext, useEffect, useState } from 'react'
import _ from 'lodash'
import { FormattedMessage, useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import { Button, Card, CardActions, CardContent, TextField, } from '@material-ui/core'
import localforage from 'localforage'
import { addPlanningInvestible } from '../../../api/investibles'
import QuillEditor from '../../../components/TextEditors/QuillEditor'
import { processTextAndFilesForSave } from '../../../api/files'
import { formInvestibleLink, formMarketLink } from '../../../utils/marketIdPathFunctions'
import AssignmentList from './AssignmentList'
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { useHistory } from 'react-router'
import queryString from 'query-string'
import CardType, { STORY_TYPE } from '../../../components/CardType'
import { DaysEstimate } from '../../../components/AgilePlan'
import DismissableText from '../../../components/Notifications/DismissableText'

function PlanningInvestibleAdd(props) {
  const {
    marketId, classes, onCancel, onSave, storedState, onSpinComplete, createdAt,
  } = props;
  const intl = useIntl();
  const { description: storedDescription, name: storedName, assignments: storedAssignments,
    days_estimate: storedDaysEstimate } = storedState;
  const [draftState, setDraftState] = useState(storedState);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const emptyInvestible = { name: storedName };
  const [currentValues, setCurrentValues] = useState(emptyInvestible);
  const [description, setDescription] = useState(storedDescription);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [assignments, setAssignments] = useState(storedAssignments);
  const [validForm, setValidForm] = useState(false);
  const [daysEstimate, setDaysEstimate] = useState(storedDaysEstimate);
  const { name } = currentValues;
  const history = useHistory();

  function getUrlAssignee() {
    const { location } = history;
    const { hash } = location;
    if (!_.isEmpty(hash)) {
      const values = queryString.parse(hash);
      const { assignee } = values;
      return [assignee];
    }
    return undefined;
  }

  useEffect(() => {
    // Long form to prevent flicker
    if (name && !_.isEmpty(description)
      && !_.isEmpty(assignments)) {
      if (!validForm) {
        setValidForm(true);
      }
    } else if (validForm) {
      setValidForm(false);
    }
  }, [name, description, assignments, validForm]);

  const itemKey = `add_investible_${marketId}`;
  function handleDraftState(newDraftState) {
    setDraftState(newDraftState);
    localforage.setItem(itemKey, newDraftState);
  }
  function handleChange(field) {
    return (event) => {
      const { value } = event.target;
      const newValues = { ...currentValues, [field]: value };
      setCurrentValues(newValues);
      handleDraftState({ ...draftState, [field]: value });
    };
  }

  function onAssignmentsChange(newAssignments) {
    setAssignments(newAssignments);
    handleDraftState({ ...draftState, assignments: newAssignments });
  }

  function onEditorChange(description) {
    setDescription(description);
  }

  function onStorageChange(description) {
    localforage.getItem(itemKey).then((stateFromDisk) => {
      handleDraftState({ ...stateFromDisk, description });
    });
  }

  function onS3Upload(metadatas) {
    setUploadedFiles(metadatas);
  }

  function zeroCurrentValues() {
    setCurrentValues(emptyInvestible);
    setDescription('');
  }

  function handleCancel() {
    zeroCurrentValues();
    onCancel(formMarketLink(marketId));
  }

  function onDaysEstimateChange(event) {
    const { value } = event.target;
    const valueInt = value ? parseInt(value, 10) : null;
    setDaysEstimate(valueInt);
    handleDraftState({ ...draftState, days_estimate: valueInt });
  }

  function handleSave() {
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(uploadedFiles, description);
    const addInfo = {
      marketId,
      uploadedFiles: filteredUploads,
      description: tokensRemoved,
      name,
      assignments,
    };
    if (daysEstimate) {
      addInfo.daysEstimate = daysEstimate;
    }
    return addPlanningInvestible(addInfo).then((inv) => {
      const { investible } = inv;
      onSave(inv);
      const link = formInvestibleLink(marketId, investible.id);
      return {
        result: link,
        spinChecker: () => Promise.resolve(true),
      };
    });
  }

  return (
    <>
      <DismissableText textId='planningInvestibleAddHelp' />
      <Card>
        <CardType
          className={classes.cardType}
          label={`${intl.formatMessage({
            id: "investibleDescription"
          })}`}
          type={STORY_TYPE}
        />
        <CardContent className={classes.cardContent}>
          <AssignmentList
            marketId={marketId}
            onChange={onAssignmentsChange}
            previouslyAssigned={storedAssignments || getUrlAssignee()}
          />
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
            marketId={marketId}
            onChange={onEditorChange}
            onStoreChange={onStorageChange}
            placeholder={intl.formatMessage({ id: 'investibleAddDescriptionDefault' })}
            onS3Upload={onS3Upload}
            defaultValue={description}
            setOperationInProgress={setOperationRunning}
          />
        </CardContent>
        <CardActions className={classes.actions}>
            <Button
              className={classes.actionSecondary}
              color="secondary"
              variant="contained"
              onClick={handleCancel}
            >
              <FormattedMessage
                id={"marketAddCancelLabel"}
              />
            </Button>
            <SpinBlockingButton
              onClick={handleSave}
              onSpinStop={onSpinComplete}
              className={classes.actionPrimary}
              color="primary"
              disabled={!validForm}
              marketId={marketId}
              variant="contained"
            >
              <FormattedMessage
                id={"agilePlanFormSaveLabel"}
              />
            </SpinBlockingButton>
        </CardActions>
      </Card>
    </>
  );
}

PlanningInvestibleAdd.propTypes = {
  classes: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  onCancel: PropTypes.func,
  onSpinComplete: PropTypes.func,
  onSave: PropTypes.func,
  // eslint-disable-next-line react/forbid-prop-types
  marketPresences: PropTypes.arrayOf(PropTypes.object).isRequired,
  storedState: PropTypes.object.isRequired,
};

PlanningInvestibleAdd.defaultProps = {
  onSave: () => {
  },
  onSpinComplete: () => {},
  onCancel: () => {
  },
};

export default PlanningInvestibleAdd;
