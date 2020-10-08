import React, { useContext, useState } from 'react'
import _ from 'lodash'
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
import { urlHelperGetName } from '../../../utils/marketIdPathFunctions'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'

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
  const { name } = currentValues;
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [description, setDescription] = useState(storedDescription || initialDescription);
  const [marketState] = useContext(MarketsContext);
  const [investibleState] = useContext(InvestiblesContext);

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
    const newUploadedFiles = _.uniqBy([...uploadedFiles, ...oldInvestibleUploadedFiles], 'path');
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
      .then((fullInvestible) => {
        return {
          result: { fullInvestible },
          spinChecker: () => Promise.resolve(true),
        };
      });
  }

  return (
    <Card elevation={0}>
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
          getUrlName={urlHelperGetName(marketState, investibleState)}
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
          disabled={!name}
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
