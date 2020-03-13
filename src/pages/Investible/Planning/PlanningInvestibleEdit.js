import React, { useContext, useEffect, useState } from 'react';
import { injectIntl } from 'react-intl';
import {
  Button,
  Card, CardActions, CardContent, TextField, Typography, withStyles,
} from '@material-ui/core'
import _ from 'lodash';
import localforage from 'localforage';
import PropTypes from 'prop-types';
import { updateInvestible } from '../../../api/investibles';
import QuillEditor from '../../../components/TextEditors/QuillEditor';
import { processTextAndFilesForSave } from '../../../api/files';
import { getMarketInfo } from '../../../utils/userFunctions';
import AssignmentList from '../../Dialog/Planning/AssignmentList';
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton';
import SpinBlockingButtonGroup from '../../../components/SpinBlocking/SpinBlockingButtonGroup';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { makeStyles } from '@material-ui/core/styles'
import InputAdornment from '@material-ui/core/InputAdornment'

const styles = (theme) => ({
  root: {
    padding: theme.spacing(2),
  },
  row: {
    marginBottom: theme.spacing(2),
    '&:last-child': {
      marginBottom: 0,
    },
  },
});

function PlanningInvestibleEdit(props) {
  const {
    fullInvestible, intl, classes, onCancel, onSave, marketId, storedState, isAssign,
  } = props;
  const { description: storedDescription, name: storedName, assignments: storedAssignments,
    days_estimate: storedDaysEstimate } = storedState;
  const [draftState, setDraftState] = useState(storedState);
  const myInvestible = fullInvestible.investible;
  const marketInfo = getMarketInfo(fullInvestible, marketId) || {};
  const { assigned: marketAssigned, days_estimate: marketDaysEstimate } = marketInfo;
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
    // uploaded files on edit is the union of the new uploaded files and the old uploaded files
    const oldInvestibleUploadedFiles = myInvestible.uploaded_files || [];
    const newUploadedFiles = [...uploadedFiles, ...oldInvestibleUploadedFiles];
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
    // changes to assignments should only be sent if they actually changed
    // otherwise we'll generate a spurious version bump due to market info changes
    if (!_.isEqual(daysEstimate, marketDaysEstimate)) {
      updateInfo.daysEstimate = daysEstimate;
    }
    if (!_.isEqual(assignments, assigned)) {
      updateInfo.assignments = assignments;
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

  return (
    <Card>
      <CardContent>
        {isAssign && (
          <AssignmentList
            marketId={marketId}
            previouslyAssigned={assigned}
            onChange={handleAssignmentChange}
          />
        )}
        {!isAssign && (
          <>
          <TextField
            className={classes.row}
            inputProps={{ maxLength: 255 }}
            id="name"
            helperText={intl.formatMessage({ id: 'investibleEditTitleLabel' })}
            margin="normal"
            fullWidth
            variant="outlined"
            value={name}
            onChange={handleChange('name')}
          />
          <TextField
            id="standard-number"
            label={intl.formatMessage({ id: 'agilePlanFormDaysEstimateLabel' })}
            helperText={intl.formatMessage({ id: 'daysEstimateInputLabel' })}
            type="number"
            InputLabelProps={{
              shrink: true,
            }}
            InputProps={{
              endAdornment: <InputSuffix>days</InputSuffix>,
            }}
            variant="outlined"
            onChange={onDaysEstimateChange}
            value={daysEstimate}
          />
          <Typography>
            {intl.formatMessage({ id: 'descriptionEdit' })}
          </Typography>
          <QuillEditor
            onS3Upload={handleFileUpload}
            onChange={onEditorChange}
            onStoreChange={onStorageChange}
            defaultValue={description}
            setOperationInProgress={setOperationRunning}
          />
        </>
        )}
      </CardContent>
      <CardActions>
        {isAssign && (
          <Button
            onClick={onCancel}
          >
            {intl.formatMessage({ id: 'investibleEditCancelLabel' })}
          </Button>
        )}
        <SpinBlockingButtonGroup>
          {!isAssign && (
            <SpinBlockingButton
              marketId={marketId}
              onClick={onCancel}
            >
              {intl.formatMessage({ id: 'investibleEditCancelLabel' })}
            </SpinBlockingButton>
          )}
          <SpinBlockingButton
            marketId={marketId}
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={!validForm}
            onSpinStop={onSave}
            hasSpinChecker
          >
            {intl.formatMessage({ id: 'investibleEditSaveLabel' })}
          </SpinBlockingButton>
        </SpinBlockingButtonGroup>
      </CardActions>
    </Card>

  );
}

const useInputSuffixStyles = makeStyles(
  theme => {
    return {
      root: {
        fontSize: "inherit",
        paddingTop: theme.spacing(2) + 2
      }
    };
  },
  { name: "InputSuffix" }
);

function InputSuffix(props) {
  const { children } = props;
  const classes = useInputSuffixStyles();

  return (
    <InputAdornment className={classes.root} disableTypography position="end">
      {children}
    </InputAdornment>
  );
}

PlanningInvestibleEdit.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  intl: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  fullInvestible: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object.isRequired,
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
export default withStyles(styles)(injectIntl(PlanningInvestibleEdit));
