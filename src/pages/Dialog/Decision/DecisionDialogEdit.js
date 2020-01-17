import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Card, CardActions, CardContent, makeStyles, TextField, Typography,
} from '@material-ui/core';
import localforage from 'localforage';
import { useIntl } from 'react-intl';
import { lockPlanningMarketForEdit, updateMarket } from '../../../api/markets';
import QuillEditor from '../../../components/TextEditors/QuillEditor';
import { processTextAndFilesForSave } from '../../../api/files';
import { PLANNING_TYPE } from '../../../constants/markets';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext';
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
    editToggle,
    onCancel,
    market,
    storedDescription,
  } = props;
  const { id, market_type: marketType } = market;
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
    let chain = Promise.resolve(true);
    if (marketType === PLANNING_TYPE) {
      chain = chain.then(() => lockPlanningMarketForEdit(id, true));
    }
    chain = chain.then(() => updateMarket(id, name, tokensRemoved, filteredUploads))
      .then(() => editToggle());
    return chain;
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
  editToggle: PropTypes.func,
  onCancel: PropTypes.func,
  storedDescription: PropTypes.string.isRequired,
};

DecisionDialogEdit.defaultProps = {
  onCancel: () => {
  },
  editToggle: () => {
  },
};

export default DecisionDialogEdit;
