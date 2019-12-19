import React, { useContext, useReducer, useState } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import {
  Button, Card, CardActions, CardContent, makeStyles, TextField, Typography,
} from '@material-ui/core';
import { useHistory } from 'react-router';
import QuillEditor from '../../components/TextEditors/QuillEditor';
import ExpirationSelector from '../../components/Expiration/ExpirationSelector';
import { createDecision } from '../../api/markets';
import { formMarketLink, navigate } from '../../utils/marketIdPathFunctions';
import { processTextAndFilesForSave } from '../../api/files';
import { INITIATIVE_TYPE } from '../../constants/markets';
import { addDecisionInvestible } from '../../api/investibles';
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton';
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

function InitiativeAdd(props) {
  const intl = useIntl();
  const {
    onCancel,
    onSave,
  } = props;
  const history = useHistory();
  const classes = useStyles();
  const emptyMarket = { name: '', description: '', expiration_minutes: 1440 };
  const [currentValues, setCurrentValues] = useState(emptyMarket);
  const [description, setDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [operationRunning] = useContext(OperationInProgressContext);
  const [, addDialogDispatch] = useReducer((state, action) => {
    const { link } = action;
    if (link) {
      return { navigationLink: link };
    }
    const { navigationLink } = state;
    if (navigationLink) {
      onSave();
      navigate(history, navigationLink);
    }
    return {};
  }, {});
  const { name, expiration_minutes: expirationMinutes } = currentValues;

  function zeroCurrentValues() {
    setCurrentValues(emptyMarket);
    setDescription('');
  }

  function handleCancel() {
    zeroCurrentValues();
    onCancel();
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
    return createDecision(addInfo)
      .then((result) => {
        onSave();
        const { market_id: marketId } = result;
        const link = formMarketLink(marketId);
        addDialogDispatch({ link });
        const addInfo = {
          marketId,
          uploadedFiles: filteredUploads,
          description: tokensRemoved,
          name,
        };
        return addDecisionInvestible(addInfo);
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
          {intl.formatMessage({ id: 'marketAddExpirationLabel' }, { x: expirationMinutes / 1440 })}
        </Typography>

        <ExpirationSelector
          value={expirationMinutes}
          className={classes.row}
          onChange={handleChange('expiration_minutes')}
        />
        <QuillEditor
          onS3Upload={onS3Upload}
          onChange={onEditorChange}
          placeHolder={intl.formatMessage({ id: 'marketAddDescriptionDefault' })}
          defaultValue={description}
        />
      </CardContent>
      <CardActions>
        <Button onClick={handleCancel} disabled={operationRunning}>
          {intl.formatMessage({ id: 'marketAddCancelLabel' })}
        </Button>
        <SpinBlockingButton
          marketId={-1}
          variant="contained"
          color="primary"
          onClick={handleSave}
          onSpinStop={() => addDialogDispatch({})}
        >
          {intl.formatMessage({ id: 'marketAddSaveLabel' })}
        </SpinBlockingButton>
      </CardActions>
    </Card>
  );
}

InitiativeAdd.propTypes = {
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
};

InitiativeAdd.defaultProps = {
  onCancel: () => {},
  onSave: () => {},
};

export default InitiativeAdd;
