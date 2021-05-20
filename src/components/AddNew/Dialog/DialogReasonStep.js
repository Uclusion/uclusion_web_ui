import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import _ from 'lodash';
import { useIntl } from 'react-intl';
import StepButtons from '../StepButtons';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import { useEditor } from '../../TextEditors/quillHooks';
import { getQuillStoredState } from '../../TextEditors/QuillEditor2'

function DialogReasonStep (props) {
  const { updateFormData, formData } = props;
  const { dialogReasonUploadedFiles } = formData;
  const intl = useIntl();
  const classes = useContext(WizardStylesContext);

  function onS3Upload (metadatas) {
    const oldUploadedFiles = dialogReasonUploadedFiles || [];
    const newUploadedFiles = _.uniqBy([...oldUploadedFiles, ...metadatas], 'path');
    updateFormData({
      dialogReasonUploadedFiles: newUploadedFiles
    });
  }

  const editorName = "DialogReasonStep-editor"
  const editorSpec = {
    onUpload: onS3Upload,
    value: getQuillStoredState(editorName),
    placeholder: intl.formatMessage({ id: 'DialogWizardReasonPlaceHolder' }),
  }

  const [Editor] = useEditor(editorName, editorSpec);

  function onStepChange () {
    updateFormData({
      dialogReason: getQuillStoredState(editorName),
    });
  }

  return (
    <WizardStepContainer
      {...props}
      titleId="DialogWizardDialogReasonStepLabel"
    >
      <div>
        <Typography className={classes.introText} variant="body2">
          Provide a context for the Dialog by entering below.
        </Typography>
        {Editor}
        <div className={classes.borderBottom} />
        <StepButtons {...props}
                     showSkip={true}
                     showFinish={false}
                     onPrevious={onStepChange}
                     onNext={onStepChange}/>
      </div>
    </WizardStepContainer>
  );
}

DialogReasonStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

DialogReasonStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};

export default DialogReasonStep;