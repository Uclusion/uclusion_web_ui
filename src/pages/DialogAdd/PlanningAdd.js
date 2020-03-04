import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Button, Card, CardActions, CardContent, makeStyles, TextField, Typography,
} from '@material-ui/core';
import localforage from 'localforage';
import QuillEditor from '../../components/TextEditors/QuillEditor';
import { createPlanning } from '../../api/markets';
import { processTextAndFilesForSave } from '../../api/files';
import { PLANNING_TYPE } from '../../constants/markets';
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton';
import SpinBlockingButtonGroup from '../../components/SpinBlocking/SpinBlockingButtonGroup';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import { useHistory } from 'react-router'
import queryString from 'query-string'

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
  },
  row: {
    marginBottom: theme.spacing(2),
    '&:last-child': {
      marginBottom: 0,
    },
  },
}));

function PlanningAdd(props) {
  const intl = useIntl();
  const history = useHistory();
  const { location } = history;
  const { hash } = location;
  const values = queryString.parse(hash);
  const { investibleId: parentInvestibleId, id: parentMarketId } = values;
  const {
    onSpinStop, storedState, onSave
  } = props;
  const { description: storedDescription, name: storedName, max_budget: storedBudget,
    investment_expiration: storedExpiration, days_estimate: storedDaysEstimate,
    votes_required: storedVotesRequired } = storedState;
  const [draftState, setDraftState] = useState(storedState);
  const classes = useStyles();
  const emptyPlan = { name: storedName };
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [currentValues, setCurrentValues] = useState(emptyPlan);
  const [validForm, setValidForm] = useState(false);
  const [description, setDescription] = useState(storedDescription);
  const [investmentExpiration, setInvestmentExpiration] = useState(storedExpiration || 14);
  const [maxBudget, setMaxBudget] = useState(storedBudget || 14);
  const [daysEstimate, setDaysEstimate] = useState(storedDaysEstimate);
  const [votesRequired, setVotesRequired] = useState(storedVotesRequired);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const { name } = currentValues;

  useEffect(() => {
    // Long form to prevent flicker
    if (name && description && description.length > 0) {
      if (!validForm) {
        setValidForm(true);
      }
    } else if (validForm) {
      setValidForm(false);
    }
  }, [name, description, validForm]);

  function handleCancel() {
    onSpinStop();
  }
  const itemKey = `add_market_${PLANNING_TYPE}`;
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

  /** This might not work if the newUploads it sees is always old * */
  function onS3Upload(metadatas) {
    setUploadedFiles(metadatas);
  }

  function onEditorChange(description) {
    setDescription(description);
  }

  function onStorageChange(description) {
    localforage.getItem(itemKey).then((stateFromDisk) => {
      handleDraftState({ ...stateFromDisk, description });
    });
  }

  function onInvestmentExpirationChange(event) {
    const { value } = event.target;
    const valueInt = value ? parseInt(value, 10) : null;
    setInvestmentExpiration(valueInt);
    handleDraftState({ ...draftState, investment_expiration: valueInt });
  }

  function onMaxBudgetChange(event) {
    const { value } = event.target;
    const valueInt = value ? parseInt(value, 10) : null;
    setMaxBudget(valueInt);
    handleDraftState({ ...draftState, max_budget: valueInt });
  }

  function onDaysEstimateChange(event) {
    const { value } = event.target;
    const valueInt = value ? parseInt(value, 10) : null;
    setDaysEstimate(valueInt);
    handleDraftState({ ...draftState, days_estimate: valueInt });
  }

  function onVotesRequiredEstimateChange(event) {
    const { value } = event.target;
    const valueInt = value ? parseInt(value, 10) : null;
    setVotesRequired(valueInt);
    handleDraftState({ ...draftState, votes_required: valueInt });
  }

  function handleSave() {
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(uploadedFiles, description);
    const addInfo = {
      name,
      uploaded_files: filteredUploads,
      market_type: PLANNING_TYPE,
      description: tokensRemoved,
    };
    if (investmentExpiration != null) {
      addInfo.investment_expiration = investmentExpiration;
    }
    if (maxBudget != null) {
      addInfo.max_budget = maxBudget;
    }
    if (daysEstimate != null) {
      addInfo.days_estimate = daysEstimate;
    }
    if (parentInvestibleId) {
      addInfo.parent_investible_id = parentInvestibleId;
    }
    if (parentMarketId) {
      addInfo.parent_market_id = parentMarketId;
    }
    if (votesRequired != null) {
      addInfo.votes_required = votesRequired;
    }
    return createPlanning(addInfo)
      .then((result) => {
        onSave(result);
        const { market: {id: marketId} } = result;
        return {
          result: marketId,
          spinChecker: () => Promise.resolve(true),
        };
      });
  }

  return (
    <Card>
      <CardContent>
        <TextField
          className={classes.row}
          inputProps={{ maxLength: 255 }}
          id="name"
          helperText={intl.formatMessage({ id: 'marketAddTitleLabel' })}
          placeholder={intl.formatMessage({ id: 'marketAddTitleDefault' })}
          margin="normal"
          fullWidth
          variant="outlined"
          value={name}
          onChange={handleChange('name')}
        />
        <TextField
          id="investmentExpiration"
          label={intl.formatMessage({ id: 'investmentExpirationInputLabel' })}
          type="number"
          InputLabelProps={{
            shrink: true,
          }}
          variant="outlined"
          value={investmentExpiration}
          onChange={onInvestmentExpirationChange}
        />
        <TextField
          id="maxBudget"
          label={intl.formatMessage({ id: 'maxMaxBudgetInputLabel' })}
          type="number"
          InputLabelProps={{
            shrink: true,
          }}
          variant="outlined"
          value={maxBudget}
          onChange={onMaxBudgetChange}
        />
        <TextField
          id="daysEstimate"
          label={intl.formatMessage({ id: 'daysEstimateInputLabel' })}
          type="number"
          InputLabelProps={{
            shrink: true,
          }}
          variant="outlined"
          onChange={onDaysEstimateChange}
          value={daysEstimate}
        />
        <TextField
          id="votesRequired"
          label={intl.formatMessage({ id: 'votesRequiredInputLabel' })}
          type="number"
          InputLabelProps={{
            shrink: true,
          }}
          variant="outlined"
          onChange={onVotesRequiredEstimateChange}
          value={votesRequired}
        />
        <Typography>
          {intl.formatMessage({ id: 'descriptionEdit' })}
        </Typography>
        <QuillEditor
          onS3Upload={onS3Upload}
          onChange={onEditorChange}
          onStoreChange={onStorageChange}
          placeHolder={intl.formatMessage({ id: 'marketAddDescriptionDefault' })}
          defaultValue={description}
          setOperationInProgress={setOperationRunning}
        />
      </CardContent>
      <CardActions>
        <SpinBlockingButtonGroup>
          <Button
            onClick={handleCancel}
          >
            {intl.formatMessage({ id: 'marketAddCancelLabel' })}
          </Button>
          <SpinBlockingButton
            marketId=""
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={!validForm}
            onSpinStop={onSpinStop}
          >
            {intl.formatMessage({ id: 'marketAddSaveLabel' })}
          </SpinBlockingButton>
        </SpinBlockingButtonGroup>
      </CardActions>
    </Card>
  );
}

PlanningAdd.propTypes = {
  onSpinStop: PropTypes.func,
  onSave: PropTypes.func,
  storedState: PropTypes.object.isRequired,
};

PlanningAdd.defaultProps = {
  onSpinStop: () => {
  },
  onSave: () => {},
};

export default PlanningAdd;
