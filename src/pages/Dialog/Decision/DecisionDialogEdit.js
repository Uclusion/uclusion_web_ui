import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Card, CardActions, CardContent, makeStyles, TextField, Typography,
} from '@material-ui/core';
import localforage from 'localforage';
import { useIntl } from 'react-intl';
import { updateMarket } from '../../../api/markets';
import QuillEditor from '../../../components/TextEditors/QuillEditor';
import { processTextAndFilesForSave } from '../../../api/files';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton';
import SpinBlockingButtonGroup from '../../../components/SpinBlocking/SpinBlockingButtonGroup';

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

function DecisionDialogEdit(props) {
  const {
    onSpinStop,
    onCancel,
    market,
    storedDescription,
  } = props;
  const { id } = market;
  const intl = useIntl();
  const classes = useStyles();
  const [mutableMarket, setMutableMarket] = useState(market);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const { name } = mutableMarket;
  const [description, setDescription] = useState(storedDescription || mutableMarket.description);
  const [validForm, setValidForm] = useState(true);
  const [, setOperationRunning] = useContext(OperationInProgressContext);

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

  function handleChange(name) {
    return (event) => {
      const { value } = event.target;
      setMutableMarket({ ...market, [name]: value });
    };
  }

  function handleSave() {
    // the set of files for the market is all the old files, plus our new ones
    const oldMarketUploadedFiles = market.uploaded_files || [];
    const newUploadedFiles = [...uploadedFiles, ...oldMarketUploadedFiles];
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(newUploadedFiles, description);
    return updateMarket(id, name, tokensRemoved, filteredUploads)
      .then((market) => {
        return {
          result: market,
          spinChecker: () => Promise.resolve(true),
        };
      });
  }

  function onEditorChange(content) {
    // console.log(content);
    setDescription(content);
  }

  function onStorageChange(description) {
    localforage.setItem(id, description);
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
          <Button
            onClick={onCancel}
          >
            {intl.formatMessage({ id: 'marketEditCancelLabel' })}
          </Button>
          <SpinBlockingButton
            variant="contained"
            color="primary"
            marketId={id}
            disabled={!validForm}
            onClick={handleSave}
            onSpinStop={onSpinStop}
            hasSpinChecker
          >
            {intl.formatMessage({ id: 'marketEditSaveLabel' })}
          </SpinBlockingButton>
        </SpinBlockingButtonGroup>
      </CardActions>
    </Card>
  );
}

DecisionDialogEdit.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  onSpinStop: PropTypes.func,
  onCancel: PropTypes.func,
  storedDescription: PropTypes.string.isRequired,
};

DecisionDialogEdit.defaultProps = {
  onCancel: () => {
  },
  onSpinStop: () => {
  },
};

export default DecisionDialogEdit;
