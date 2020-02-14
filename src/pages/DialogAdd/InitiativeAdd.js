import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Button, Card, CardActions, CardContent, makeStyles, TextField, Typography,
} from '@material-ui/core';
import localforage from 'localforage';
import QuillEditor from '../../components/TextEditors/QuillEditor';
import ExpirationSelector from '../../components/Expiration/ExpirationSelector';
import { createDecision } from '../../api/markets';
import { processTextAndFilesForSave } from '../../api/files';
import { INITIATIVE_TYPE } from '../../constants/markets';
import { addDecisionInvestible } from '../../api/investibles';
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton';
import SpinBlockingButtonGroup from '../../components/SpinBlocking/SpinBlockingButtonGroup';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { DiffContext } from '../../contexts/DiffContext/DiffContext';
import { addInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper';

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

function InitiativeAdd(props) {
  const intl = useIntl();
  const {
    onSpinStop, onSave, storedDescription,
  } = props;
  const classes = useStyles();
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, invDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const emptyMarket = { name: '', description: '', expiration_minutes: 1440 };
  const [validForm, setValidForm] = useState(false);
  const [currentValues, setCurrentValues] = useState(emptyMarket);
  const [description, setDescription] = useState(storedDescription);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const { name, expiration_minutes: expirationMinutes } = currentValues;

  useEffect(() => {
    // Long form to prevent flicker
    if (name && expirationMinutes > 0 && description && description.length > 0) {
      if (!validForm) {
        setValidForm(true);
      }
    } else if (validForm) {
      setValidForm(false);
    }
  }, [name, description, expirationMinutes, validForm]);

  function zeroCurrentValues() {
    setCurrentValues(emptyMarket);
    setDescription('');
  }

  function handleCancel() {
    zeroCurrentValues();
    onSpinStop();
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
    localforage.setItem(`add_market_${INITIATIVE_TYPE}`, description);
  }

  function handleSave() {
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(uploadedFiles, description);
    const addInfo = {
      name: 'NA',
      market_type: INITIATIVE_TYPE,
      description: 'NA',
      expiration_minutes: expirationMinutes,
    };
    return createDecision(addInfo, 'errorInitiativeAddFailed')
      .then((result) => {
        onSave(result);
        const { market: { id: marketId }} = result;
        const addInfo = {
          marketId,
          uploadedFiles: filteredUploads,
          description: tokensRemoved,
          name,
        };
        return addDecisionInvestible(addInfo).then((investible) => {
          addInvestible(invDispatch, diffDispatch, investible);
          return {
            result: marketId,
            spinChecker: () => Promise.resolve(true),
          };
        });
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
        <Typography
          className={classes.row}
        >
          {intl.formatMessage({ id: 'initiativeAddExpirationLabel' }, { x: expirationMinutes / 1440 })}
        </Typography>
        <ExpirationSelector
          value={expirationMinutes}
          className={classes.row}
          onChange={handleChange('expiration_minutes')}
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
            hasSpinChecker
          >
            {intl.formatMessage({ id: 'marketAddSaveLabel' })}
          </SpinBlockingButton>
        </SpinBlockingButtonGroup>
      </CardActions>
    </Card>
  );
}

InitiativeAdd.propTypes = {
  onSpinStop: PropTypes.func,
  onSave: PropTypes.func,
  storedDescription: PropTypes.string.isRequired,
};

InitiativeAdd.defaultProps = {
  onSave: () => {},
  onSpinStop: () => {
  },
};

export default InitiativeAdd;
