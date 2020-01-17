import React, { useContext, useEffect, useReducer, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { useHistory } from 'react-router';
import {
  Button, Card, CardActions, CardContent, makeStyles, TextField, Typography,
} from '@material-ui/core';
import localforage from 'localforage';
import QuillEditor from '../../components/TextEditors/QuillEditor';
import { createPlanning } from '../../api/markets';
import { formMarketLink, navigate } from '../../utils/marketIdPathFunctions';
import { processTextAndFilesForSave } from '../../api/files';
import { PLANNING_TYPE } from '../../constants/markets';
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton';
import SpinBlockingButtonGroup from '../../components/SpinBlocking/SpinBlockingButtonGroup';
import { checkMarketInStorage } from '../../contexts/MarketsContext/marketsContextHelper';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext';

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
  const {
    onDone, storedDescription,
  } = props;
  const history = useHistory();
  const classes = useStyles();
  const emptyPlan = { name: '' };
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [currentValues, setCurrentValues] = useState(emptyPlan);
  const [validForm, setValidForm] = useState(false);
  const [description, setDescription] = useState(storedDescription);
  const [investmentExpiration, setInvestmentExpiration] = useState(undefined);
  const [maxBudget, setMaxBudget] = useState(undefined);
  const [daysEstimate, setDaysEstimate] = useState(undefined);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [, addDialogDispatch] = useReducer((state, action) => {
    const { link } = action;
    if (link) {
      return { navigationLink: link };
    }
    const { navigationLink } = state;
    if (navigationLink) {
      navigate(history, navigationLink);
    }
    return {};
  }, {});
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

  function zeroCurrentValues() {
    setCurrentValues(emptyPlan);
    setDescription('');
  }

  function handleCancel() {
    zeroCurrentValues();
    onDone();
  }

  function handleChange(field) {
    return (event) => {
      const { value } = event.target;
      const newValues = { ...currentValues, [field]: value };
      setCurrentValues(newValues);
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
    localforage.setItem(`add_market_${PLANNING_TYPE}`, description);
  }

  function onInvestmentExpirationChange(event) {
    const { value } = event.target;
    setInvestmentExpiration(parseInt(value, 10));
  }

  function onMaxBudgetChange(event) {
    const { value } = event.target;
    setMaxBudget(parseInt(value, 10));
  }

  function onDaysEstimateChange(event) {
    const { value } = event.target;
    setDaysEstimate(parseInt(value, 10));
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
    if (investmentExpiration) {
      addInfo.investment_expiration = investmentExpiration;
    }
    if (maxBudget) {
      addInfo.max_budget = maxBudget;
    }
    if (daysEstimate) {
      addInfo.days_estimate = daysEstimate;
    }
    return createPlanning(addInfo)
      .then((result) => {
        onDone();
        const { market_id: marketId } = result;
        const link = formMarketLink(marketId);
        addDialogDispatch({ link });
        return {
          spinChecker: () => checkMarketInStorage(marketId),
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
          id="standard-number"
          label={intl.formatMessage({ id: 'investmentExpirationInputLabel' })}
          type="number"
          InputLabelProps={{
            shrink: true,
          }}
          variant="outlined"
          onChange={onInvestmentExpirationChange}
        />
        <TextField
          id="standard-number"
          label={intl.formatMessage({ id: 'maxMaxBudgetInputLabel' })}
          type="number"
          InputLabelProps={{
            shrink: true,
          }}
          variant="outlined"
          onChange={onMaxBudgetChange}
        />
        <TextField
          id="standard-number"
          label={intl.formatMessage({ id: 'daysEstimateInputLabel' })}
          type="number"
          InputLabelProps={{
            shrink: true,
          }}
          variant="outlined"
          onChange={onDaysEstimateChange}
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
            onSpinStop={() => addDialogDispatch({})}
          >
            {intl.formatMessage({ id: 'marketAddSaveLabel' })}
          </SpinBlockingButton>
        </SpinBlockingButtonGroup>
      </CardActions>
    </Card>
  );
}

PlanningAdd.propTypes = {
  onDone: PropTypes.func,
  storedDescription: PropTypes.string.isRequired,
};

PlanningAdd.defaultProps = {
  onDone: () => {
  },
};

export default PlanningAdd;
