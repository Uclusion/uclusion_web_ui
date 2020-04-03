import React, { useContext, useEffect, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import { Card, CardActions, CardContent, TextField, } from '@material-ui/core'
import localforage from 'localforage'
import PropTypes from 'prop-types'
import { updateInvestible } from '../../../api/investibles'
import QuillEditor from '../../../components/TextEditors/QuillEditor'
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton'
import { processTextAndFilesForSave } from '../../../api/files'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { usePlanFormStyles } from '../../../components/AgilePlan'
import CardType, { VOTING_TYPE } from '../../../components/CardType'

function InitiativeInvestibleEdit(props) {
  const {
    fullInvestible, onCancel, onSave, marketId, storedState,
  } = props;
  const intl = useIntl();
  const classes = usePlanFormStyles();
  const { description: storedDescription, name: storedName } = storedState;
  const [draftState, setDraftState] = useState(storedState);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const myInvestible = fullInvestible.investible;
  const { id, description: initialDescription, name: initialName } = myInvestible;
  const [currentValues, setCurrentValues] = useState({ ...myInvestible, name: storedName || initialName });
  const [validForm, setValidForm] = useState(true);
  const { name } = currentValues;
  const initialUploadedFiles = myInvestible.uploaded_files || [];
  const [uploadedFiles, setUploadedFiles] = useState(initialUploadedFiles);
  const [description, setDescription] = useState(storedDescription || initialDescription);

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

  function handleDraftState(newDraftState) {
    setDraftState(newDraftState);
    localforage.setItem(id, newDraftState);
  }

  function handleChange(field) {
    return (event) => {
      const { value } = event.target;
      const newValues = { ...currentValues, [field]: value };
      setCurrentValues(newValues);
      handleDraftState({ ...draftState, [field]: value });
    };
  }

  function onEditorChange(description) {
    setDescription(description);
  }

  function onStorageChange(description) {
    localforage.getItem(id).then((stateFromDisk) => {
      handleDraftState({ ...stateFromDisk, description });
    });
  }

  function handleFileUpload(metadatas) {
    setUploadedFiles(metadatas);
  }

  function saveInvestible() {
    const oldInvestibleUploadedFiles = myInvestible.uploaded_files || [];
    // uploaded files on edit is the union of the new uploaded files and the old uploaded files
    const newUploadedFiles = [...uploadedFiles, ...oldInvestibleUploadedFiles];
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(newUploadedFiles, description);
    const updateInfo = {
      uploadedFiles: filteredUploads,
      name,
      description: tokensRemoved,
      marketId,
      investibleId: id,
    };
    return updateInvestible(updateInfo)
      .then((investible) => {
        return {
          result: { investible },
          spinChecker: () => Promise.resolve(true),
        };
      });
  }

  return (
    <Card>
      <CardType
        className={classes.cardType}
        label={`${intl.formatMessage({
          id: "initiativeInvestibleDescription"
        })}`}
        type={VOTING_TYPE}
      />
      <CardContent className={classes.cardContent}>
        <TextField
          fullWidth
          id="initiative-name"
          label={intl.formatMessage({ id: "agilePlanFormTitleLabel" })}
          onChange={handleChange('name')}
          placeholder={intl.formatMessage({
            id: "initiativeTitlePlaceholder"
          })}
          value={name}
          variant="filled"
        />
        <QuillEditor
          onS3Upload={handleFileUpload}
          marketId={marketId}
          onChange={onEditorChange}
          onStoreChange={onStorageChange}
          defaultValue={description}
          setOperationInProgress={setOperationRunning}
        />
      </CardContent>
      <CardActions className={classes.actions}>
        <SpinBlockingButton
          marketId={marketId}
          onClick={onCancel}
          className={classes.actionSecondary}
          color="secondary"
          variant="contained"
          hasSpinChecker
        >
          <FormattedMessage
            id="marketAddCancelLabel"
          />
        </SpinBlockingButton>
        <SpinBlockingButton
          marketId={marketId}
          variant="contained"
          color="primary"
          onClick={saveInvestible}
          disabled={!validForm}
          onSpinStop={onSave}
          hasSpinChecker
          id="save"
          className={classes.actionPrimary}
        >
          <FormattedMessage
            id="agilePlanFormSaveLabel"
          />
        </SpinBlockingButton>
      </CardActions>
    </Card>

  );
}

InitiativeInvestibleEdit.propTypes = {
  fullInvestible: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
  storedState: PropTypes.object.isRequired,
};

InitiativeInvestibleEdit.defaultProps = {
  onSave: () => {
  },
  onCancel: () => {
  },
};
export default InitiativeInvestibleEdit;
