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
import { formMarketLink } from '../../utils/marketIdPathFunctions';
import { processTextAndFilesForSave } from '../../api/files';
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton';
import SpinBlockingButtonGroup from '../../components/SpinBlocking/SpinBlockingButtonGroup';
import { checkMarketInStorage } from '../../contexts/MarketsContext/marketsContextHelper';
import { DECISION_TYPE } from '../../constants/markets';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext';
import ReactJoyride from 'react-joyride';

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
    onDone, storedDescription,
  } = props;
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const classes = useStyles();
  const emptyMarket = { name: '', description: '', expiration_minutes: 1440 };
  const [validForm, setValidForm] = useState(false);
  const [currentValues, setCurrentValues] = useState(emptyMarket);
  const [description, setDescription] = useState(storedDescription);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const { name, expiration_minutes } = currentValues;

  const tourSteps = [
    {
      content: "If you don't have a decision you need help with right now, then getting lunch with your friends is a good start.",
      target: '#tourRoot',
      placement: 'top-start',
      disableBeacon: true,
    },
    {
      content: "Enter a good short name for your dialog in the 'Name' field, or 'Where should we get lunch' if you don't have one.",
      target: '#name',
      disableBeacon: true,
    },
    { content: "Decisions have deadlines, hence we make the dialog end after a set period of time. In this case 1 day. Feel free to set a longer time if you want",
      target: '#expires',
    },
    {
      content: "Most of the time, one sentence isn't enough to describe the decision to be made. Enter any contextual information needed into the description. If it's just lunch, then feel free to just enter the time you want to go",
      target: '#description',
    }
  ];

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
    onDone('/');
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
        const { market_id: marketId } = result;
        const link = formMarketLink(marketId);
        return {
          result: link,
          spinChecker: () => checkMarketInStorage(marketId),
        };
      });
  }

  return (
    <Card id="tourRoot">
      <ReactJoyride
        steps={tourSteps}
        run
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
          {intl.formatMessage({ id: 'marketAddExpirationLabel' }, { x: expiration_minutes / 1440 })}
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
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={!validForm}
            onSpinStop={onDone}
          >
            {intl.formatMessage({ id: 'marketAddSaveLabel' })}
          </SpinBlockingButton>
        </SpinBlockingButtonGroup>
      </CardActions>
    </Card>
  );
}

DecisionAdd.propTypes = {
  onDone: PropTypes.func,
  storedDescription: PropTypes.string.isRequired,
};

DecisionAdd.defaultProps = {
  onDone: () => {
  },
};

export default DecisionAdd;
