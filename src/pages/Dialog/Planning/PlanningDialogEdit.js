import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Card, CardActions, CardContent, makeStyles, TextField, Typography,
} from '@material-ui/core';
import { useIntl } from 'react-intl';
import localforage from 'localforage';
import { lockPlanningMarketForEdit, updateMarket } from '../../../api/markets';
import QuillEditor from '../../../components/TextEditors/QuillEditor';
import { processTextAndFilesForSave } from '../../../api/files';
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton';
import SpinBlockingButtonGroup from '../../../components/SpinBlocking/SpinBlockingButtonGroup';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';

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

function PlanningDialogEdit(props) {
  const {
    onSpinStop,
    onCancel,
    market,
    storedState,
  } = props;
  const { id, name: initialMarketName, max_budget: initialBudget,
    investment_expiration: initialExpiration, days_estimate: initialDaysEstimate } = market;
  const { description: storedDescription, name: storedName, max_budget: storedBudget,
    investment_expiration: storedExpiration, days_estimate: storedDaysEstimate } = storedState;
  const intl = useIntl();
  const classes = useStyles();
  const [mutableMarket, setMutableMarket] = useState({ ...market, name: storedName || initialMarketName,
  max_budget: storedBudget || initialBudget, investment_expiration: storedExpiration || initialExpiration,
    days_estimate: storedDaysEstimate || initialDaysEstimate });
  const [draftState, setDraftState] = useState(storedState);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const { name, max_budget, investment_expiration, days_estimate } = mutableMarket;
  const [description, setDescription] = useState(storedDescription || mutableMarket.description);
  const [validForm, setValidForm] = useState(true);

  useEffect(() => {
    // Long form to prevent flicker
    if (name && parseInt(investment_expiration, 10) > 0 && parseInt(max_budget, 10) > 0
      && description && description.length > 0) {
      if (!validForm) {
        setValidForm(true);
      }
    } else if (validForm) {
      setValidForm(false);
    }
  }, [name, description, investment_expiration, max_budget, validForm]);

  function handleChange(name) {
    return (event) => {
      const { value } = event.target;
      setMutableMarket({ ...mutableMarket, [name]: value });
      handleDraftState({ ...draftState, [name]: value });
    };
  }

  function handleDraftState(newDraftState) {
    setDraftState(newDraftState);
    localforage.setItem(id, newDraftState);
  }

  function handleSave() {
    // the set of files for the market is all the old files, plus our new ones
    const oldMarketUploadedFiles = market.uploaded_files || [];
    const newUploadedFiles = [...uploadedFiles, ...oldMarketUploadedFiles];
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(newUploadedFiles, description);
    const daysEstimateInt = days_estimate ? parseInt(days_estimate, 10) : null;
    return lockPlanningMarketForEdit(id, true)
      .then(() => updateMarket(id, name, tokensRemoved, filteredUploads, parseInt(max_budget, 10), parseInt(investment_expiration, 10), daysEstimateInt))
      .then((market) => {
        return {
          result: market,
          spinChecker: () => Promise.resolve(true),
        }
      });
  }

  function onEditorChange(content) {
    setDescription(content);
  }

  function onStorageChange(description) {
    localforage.getItem(id).then((stateFromDisk) => {
      handleDraftState({ ...stateFromDisk, description });
    });
  }

  function onS3Upload(metadatas) {
    setUploadedFiles(metadatas);
  }

  return (
    <Card>
      <CardContent>
        <TextField
          className={classes.row}
          inputProps={{ maxLength: 255 }}
          id="name"
          helperText={intl.formatMessage({ id: 'marketEditTitleLabel' })}
          margin="normal"
          fullWidth
          variant="outlined"
          value={name}
          onChange={handleChange('name')}
        />
          <TextField
            id="maxBudget"
            label={intl.formatMessage({ id: 'maxMaxBudgetInputLabel' })}
            type="number"
            InputLabelProps={{
              shrink: true,
            }}
            variant="outlined"
            onChange={handleChange('max_budget')}
            value={max_budget}
          />
          <TextField
            id="daysEstimate"
            label={intl.formatMessage({ id: 'daysEstimateInputLabel' })}
            type="number"
            InputLabelProps={{
              shrink: true,
            }}
            variant="outlined"
            onChange={handleChange('days_estimate')}
            value={days_estimate}
          />
          <TextField
            id="investmentExpiration"
            label={intl.formatMessage({ id: 'investmentExpirationInputLabel' })}
            type="number"
            InputLabelProps={{
              shrink: true,
            }}
            variant="outlined"
            onChange={handleChange('investment_expiration')}
            value={investment_expiration}
          />
        <Typography>
          {intl.formatMessage({ id: 'descriptionEdit' })}
        </Typography>
        <QuillEditor
          onChange={onEditorChange}
          onStoreChange={onStorageChange}
          defaultValue={description}
          marketId={id}
          onS3Upload={onS3Upload}
          setOperationInProgress={setOperationRunning}
        />
      </CardContent>
      <CardActions>
        <SpinBlockingButtonGroup>
          <SpinBlockingButton
            marketId={id}
            onClick={onCancel}
          >
            {intl.formatMessage({ id: 'marketEditCancelLabel' })}
          </SpinBlockingButton>
          <SpinBlockingButton
            marketId={id}
            variant="contained"
            color="primary"
            disabled={!validForm}
            onSpinStop={onSpinStop}
            onClick={handleSave}
          >
            {intl.formatMessage({ id: 'marketEditSaveLabel' })}
          </SpinBlockingButton>
        </SpinBlockingButtonGroup>
      </CardActions>
    </Card>
  );
}

PlanningDialogEdit.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  onSpinStop: PropTypes.func,
  onCancel: PropTypes.func,
  storedState: PropTypes.object.isRequired,
};

PlanningDialogEdit.defaultProps = {
  onCancel: () => {
  },
  onSpinStop: () => {
  },
};

export default PlanningDialogEdit;
