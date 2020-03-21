import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button, Card, CardActions, CardContent, Checkbox, TextField, Typography,
} from '@material-ui/core'
import localforage from 'localforage';
import _ from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl'
import { updateMarket } from '../../../api/markets';
import QuillEditor from '../../../components/TextEditors/QuillEditor';
import { processTextAndFilesForSave } from '../../../api/files';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton';
import CardType, { DECISION_TYPE } from '../../../components/CardType';
import { usePlanFormStyles } from '../../../components/AgilePlan'

function DecisionDialogEdit(props) {
  const {
    onSpinStop,
    onCancel,
    market,
    storedState,
  } = props;
  const { id, name: initialMarketName, allow_multi_vote: allowMultiVote, description: initialDescription } = market;
  const { description: storedDescription, name: storedName } = storedState;
  const intl = useIntl();
  const classes = usePlanFormStyles();
  const [mutableMarket, setMutableMarket] = useState({ ...market, name: storedName || initialMarketName });
  const [draftState, setDraftState] = useState(storedState);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const { name } = mutableMarket;
  const [description, setDescription] = useState(storedDescription || initialDescription);
  const [validForm, setValidForm] = useState(true);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [multiVote, setMultiVote] = useState(allowMultiVote);

  function toggleMultiVote() {
    setMultiVote(!multiVote);
  }

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
    const updatedMultiVote = allowMultiVote !== multiVote ? multiVote : null;
    const updatedName = name !== initialMarketName ? name : null;
    const updatedDescription = description !== initialDescription ? tokensRemoved : null;
    const updatedFilteredUploads = _.isEmpty(uploadedFiles) ? filteredUploads : null;
    return updateMarket(id, updatedName, updatedDescription, updatedFilteredUploads, null,
      null, null, null, updatedMultiVote)
      .then((market) => {
        return {
          result: market,
          spinChecker: () => Promise.resolve(true),
        };
      });
  }

  function onEditorChange(content) {
    // // console.log(content);
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
      <CardType className={classes.cardType} type={DECISION_TYPE} />
      <CardContent className={classes.cardContent}>
        <Typography>
          {intl.formatMessage({ id: 'allowMultiVote' })}
          <Checkbox
            id="multiVote"
            name="multiVote"
            checked={multiVote}
            onChange={toggleMultiVote}
          />
        </Typography>
        <TextField
          fullWidth
          id="decision-name"
          label={intl.formatMessage({ id: "agilePlanFormTitleLabel" })}
          onChange={handleChange('name')}
          placeholder={intl.formatMessage({
            id: "decisionTitlePlaceholder"
          })}
          value={name}
          variant="filled"
        />
        <QuillEditor
          onChange={onEditorChange}
          onStoreChange={onStorageChange}
          defaultValue={description}
          marketId={id}
          onS3Upload={onS3Upload}
          setOperationInProgress={setOperationRunning}
        />
      </CardContent>
      <CardActions className={classes.actions}>
        <Button
          onClick={onCancel}
          className={classes.actionSecondary}
          color="secondary"
          variant="contained">
          <FormattedMessage
            id="marketAddCancelLabel"
          />
        </Button>
        <SpinBlockingButton
          marketId={id}
          id="save"
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={!validForm}
          onSpinStop={onSpinStop}
          className={classes.actionPrimary}
          hasSpinChecker
        >
          <FormattedMessage
            id="agilePlanFormSaveLabel"
          />
        </SpinBlockingButton>
      </CardActions>
    </Card>
  );
}

DecisionDialogEdit.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  onSpinStop: PropTypes.func,
  onCancel: PropTypes.func,
  storedState: PropTypes.object.isRequired,
};

DecisionDialogEdit.defaultProps = {
  onCancel: () => {
  },
  onSpinStop: () => {
  },
};

export default DecisionDialogEdit;
