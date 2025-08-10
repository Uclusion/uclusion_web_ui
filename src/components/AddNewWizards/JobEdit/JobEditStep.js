import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { CardActions } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { processTextAndFilesForSave } from '../../../api/files';
import { getQuillStoredState, resetEditor } from '../../TextEditors/Utilities/CoreUtils';
import _ from 'lodash';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import NameField, { clearNameStoredState, getNameStoredState } from '../../TextFields/NameField';
import SpinningIconLabelButton from '../../Buttons/SpinningIconLabelButton';
import { Clear, SettingsBackupRestore } from '@material-ui/icons';
import { FormattedMessage, useIntl } from 'react-intl';
import { useEditor } from '../../TextEditors/quillHooks';
import { realeaseInvestibleEditLock, updateInvestible } from '../../../api/investibles';
import { refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { DiffContext } from '../../../contexts/DiffContext/DiffContext';

function JobEditStep(props) {
  const { marketId, investible, updateFormData, formData } = props;
  const intl = useIntl();
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const history = useHistory();
  const classes = useContext(WizardStylesContext);
  const [hasValue, setHasValue] = useState(true);
  const investibleId = investible.id;
  const { description, version } = investible || {};
  const { uploadedFiles } = formData;
  const editorName = `body-editor${investibleId}`;
  const useDescription = getQuillStoredState(editorName) || description;
  const editorSpec = {
    onUpload: (files) => updateFormData({uploadedFiles: files}),
    marketId,
    placeholder: intl.formatMessage({ id: 'investibleAddDescriptionDefault' }),
    value: useDescription,
    autoFocus: true
  };

  const [Editor] = useEditor(editorName, editorSpec);

  function handleSave() {
    // uploaded files on edit is the union of the new uploaded files and the old uploaded files
    const oldInvestibleUploadedFiles = investible.uploaded_files || [];
    const currentUploadedFiles = uploadedFiles || [];
    const newUploadedFiles = _.uniqBy([...currentUploadedFiles, ...oldInvestibleUploadedFiles],
      'path');
    const description = getQuillStoredState(editorName) !== null ? getQuillStoredState(editorName) :
      useDescription;
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(newUploadedFiles, description);
    const name = getNameStoredState(investibleId);
    const updateInfo = {
      uploadedFiles: filteredUploads,
      name,
      description: tokensRemoved,
      marketId,
      investibleId,
      version
    };
    return updateInvestible(updateInfo)
      .then((fullInvestible) => {
        setOperationRunning(false);
        resetEditor(editorName);
        clearNameStoredState(investibleId);
        refreshInvestibles(investiblesDispatch, diffDispatch, [fullInvestible]);
        navigate(history, formInvestibleLink(marketId, investibleId));
      });
  }

  function onCancel() {
    resetEditor(editorName);
    return realeaseInvestibleEditLock(marketId, investibleId).then((newInv) => {
      setOperationRunning(false);
      refreshInvestibles(investiblesDispatch, diffDispatch, [newInv]);
      navigate(history, formInvestibleLink(marketId, investibleId));
    });
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <NameField id={investibleId} setHasValue={setHasValue}/>
      {Editor}
      <CardActions className={classes.actions}>
        <SpinningIconLabelButton
          icon={SettingsBackupRestore}
          disabled={!hasValue}
          whiteBackground
          onClick={handleSave}
          id="investibleUpdateButton"
        >
          <FormattedMessage id="update" />
        </SpinningIconLabelButton>
        <SpinningIconLabelButton onClick={onCancel} icon={Clear} id="marketAddCancelButton" whiteBackground>
          {intl.formatMessage({ id: 'marketAddCancelLabel' })}
        </SpinningIconLabelButton>
      </CardActions>
    </WizardStepContainer>
  )
}

JobEditStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
}

JobEditStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
}

export default JobEditStep