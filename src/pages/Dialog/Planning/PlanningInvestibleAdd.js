import React, { useContext, useEffect, useState } from 'react';
import _ from 'lodash';
import { injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  TextField, Typography,
  withStyles,
} from '@material-ui/core';
import localforage from 'localforage';
import { addPlanningInvestible } from '../../../api/investibles';
import QuillEditor from '../../../components/TextEditors/QuillEditor';
import { processTextAndFilesForSave } from '../../../api/files';
import { formInvestibleLink, formMarketLink } from '../../../utils/marketIdPathFunctions';
import AssignmentList from './AssignmentList';
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton';
import SpinBlockingButtonGroup from '../../../components/SpinBlocking/SpinBlockingButtonGroup';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { useHistory } from 'react-router';
import queryString from 'query-string';
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

function PlanningInvestibleAdd(props) {
  const {
    marketId, intl, classes, onCancel, onSave, storedState, onSpinComplete,
  } = props;
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
    <Card>
      <CardContent>
        <AssignmentList
          marketId={marketId}
          onChange={onAssignmentsChange}
          previouslyAssigned={storedAssignments || getUrlAssignee()}
        />
        <TextField
          className={classes.row}
          inputProps={{ maxLength: 255 }}
          id="name"
          helperText={intl.formatMessage({ id: 'investibleAddTitleLabel' })}
          placeholder={intl.formatMessage({ id: 'investibleAddTitleDefault' })}
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
          marketId={marketId}
          onChange={onEditorChange}
          onStoreChange={onStorageChange}
          placeholder={intl.formatMessage({ id: 'investibleAddDescriptionDefault' })}
          onS3Upload={onS3Upload}
          defaultValue={description}
          setOperationInProgress={setOperationRunning}
        />
      </CardContent>
      <CardActions>
        <SpinBlockingButtonGroup>
          <Button
            onClick={handleCancel}
          >
            {intl.formatMessage({ id: 'investibleAddCancelLabel' })}
          </Button>
          <SpinBlockingButton
            marketId={marketId}
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={!validForm}
            onSpinStop={onSpinComplete}
          >
            {intl.formatMessage({ id: 'investibleAddSaveLabel' })}
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

PlanningInvestibleAdd.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  intl: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
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

export default withStyles(styles)(injectIntl(PlanningInvestibleAdd));
