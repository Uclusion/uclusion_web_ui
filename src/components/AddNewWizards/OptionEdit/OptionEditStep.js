import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { CardActions } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import { navigateToOption } from '../../../utils/marketIdPathFunctions';
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
import CommentBox from '../../../containers/CommentBox/CommentBox';

function OptionEditStep(props) {
  const { marketId, investible, updateFormData, formData, parentComment } = props;
  const intl = useIntl();
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const history = useHistory();
  const classes = useContext(WizardStylesContext);
  const [hasValue, setHasValue] = useState(true);
  const investibleId = investible.id;
  const { description } = investible || {};
  const { uploadedFiles } = formData;
  const editorName = `body-editor${investibleId}`;
  const useDescription = getQuillStoredState(editorName) || description;
  const { useCompression } = formData;
  const editorSpec = {
    onUpload: (files) => updateFormData({uploadedFiles: files}),
    marketId,
    placeholder: intl.formatMessage({ id: 'investibleAddDescriptionDefault' }),
    value: useDescription
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
    const name = getNameStoredState(investibleId);
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(newUploadedFiles, description);
    const updateInfo = {
      uploadedFiles: filteredUploads,
      name,
      description: tokensRemoved,
      marketId,
      investibleId,
    };
    return updateInvestible(updateInfo)
      .then((fullInvestible) => {
        setOperationRunning(false);
        resetEditor(editorName);
        clearNameStoredState(investibleId);
        refreshInvestibles(investiblesDispatch, diffDispatch, [fullInvestible]);
        navigateToOption(history, parentComment.market_id, parentComment.investible_id,
          parentComment.group_id, investibleId);
      });
  }

  function onCancel() {
    resetEditor(editorName);
    return realeaseInvestibleEditLock(marketId, investibleId).then((newInv) => {
      setOperationRunning(false);
      refreshInvestibles(investiblesDispatch, diffDispatch, [newInv]);
      navigateToOption(history, parentComment.market_id, parentComment.investible_id,
        parentComment.group_id, investibleId);
    });
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <CommentBox
        comments={[parentComment]}
        marketId={parentComment.market_id}
        allowedTypes={[]}
        removeActions={true}
        showVoting={false}
        isInbox
        toggleCompression={() => updateFormData({ useCompression: !useCompression })}
        useCompression={useCompression}
      />
      <div className={classes.borderBottom}/>
      <NameField id={investibleId} setHasValue={setHasValue}/>
      {Editor}
      <CardActions className={classes.actions}>
        <SpinningIconLabelButton onClick={onCancel} icon={Clear} id="marketAddCancelButton">
          {intl.formatMessage({ id: 'marketAddCancelLabel' })}
        </SpinningIconLabelButton>
        <SpinningIconLabelButton
          icon={SettingsBackupRestore}
          disabled={!hasValue}
          onClick={handleSave}
          id="investibleUpdateButton"
        >
          <FormattedMessage id="update"/>
        </SpinningIconLabelButton>
      </CardActions>
    </WizardStepContainer>
  )
}

OptionEditStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
}

OptionEditStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
}

export default OptionEditStep