import React, {
  useContext,
  useEffect, useState,
} from 'react';
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
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton';
import SpinBlockingButtonGroup from '../../components/SpinBlocking/SpinBlockingButtonGroup';
import { DECISION_TYPE } from '../../constants/markets';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext';
import UclusionTour from '../../components/Tours/UclusionTour';
import {
  PURE_SIGNUP_ADD_DIALOG,
  PURE_SIGNUP_ADD_DIALOG_STEPS,
  PURE_SIGNUP_FAMILY_NAME
} from '../../components/Tours/pureSignupTours';
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

function DecisionAdd(props) {
  const intl = useIntl();
  const {
    onSpinStop, storedDescription, onSave
  } = props;
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const classes = useStyles();
  const emptyMarket = { name: '', description: '', expiration_minutes: 1440 };
  const [validForm, setValidForm] = useState(false);
  const [currentValues, setCurrentValues] = useState(emptyMarket);
  const [description, setDescription] = useState(storedDescription);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const { name, expiration_minutes } = currentValues;

  useEffect(() => {
    // Long form to prevent flicker
    if (name && expiration_minutes > 0 && description && description.length > 0) {
      if (!validForm) {
        setValidForm(true);
      }
    } else if (validForm) {
      setValidForm(false);
    }
  }, [name, description, expiration_minutes, validForm]);

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
    localforage.setItem(`add_market_${DECISION_TYPE}`, description);
  }

  function handleSave() {
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(uploadedFiles, description);
    const addInfo = {
      name,
      uploaded_files: filteredUploads,
      market_type: 'DECISION',
      description: tokensRemoved,
      expiration_minutes,
    };
    return createDecision(addInfo)
      .then((result) => {
        const { market } = result;
        onSave(result);
        const { id: marketId } = market;
        return {
          result: marketId,
          spinChecker: () => {
            return Promise.resolve(true);
          },
        };
      });
  }

  return (
    <Card id="tourRoot">
      <UclusionTour
        name={PURE_SIGNUP_ADD_DIALOG}
        family={PURE_SIGNUP_FAMILY_NAME}
        steps={PURE_SIGNUP_ADD_DIALOG_STEPS}
        hideBackButton
      />
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
          {intl.formatMessage({ id: 'decisionAddExpirationLabel' }, { x: expiration_minutes / 1440 })}
        </Typography>

        <ExpirationSelector
          id="expires"
          value={expiration_minutes}
          className={classes.row}
          onChange={handleChange('expiration_minutes')}
        />
        <Typography>
          {intl.formatMessage({ id: 'descriptionEdit' })}
        </Typography>
        <QuillEditor
          id="description"
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
          <Button onClick={handleCancel}>
            {intl.formatMessage({ id: 'marketAddCancelLabel' })}
          </Button>
          <SpinBlockingButton
            marketId=""
            id="save"
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

DecisionAdd.propTypes = {
  onSpinStop: PropTypes.func,
  onSave: PropTypes.func,
  storedDescription: PropTypes.string.isRequired,
};

DecisionAdd.defaultProps = {
  onSave: () => {},
  onSpinStop: () => {
  },
};

export default DecisionAdd;
