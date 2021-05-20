import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import _ from 'lodash';
import { useIntl } from 'react-intl';
import StepButtons from '../../StepButtons';
import WizardStepContainer from '../../WizardStepContainer';
import { WizardStylesContext } from '../../WizardStylesContext';
import { useEditor } from '../../../TextEditors/quillHooks';
import { getQuillStoredState } from '../../../TextEditors/QuillEditor2'

function OptionDescriptionStep (props) {
  const { updateFormData, formData } = props;
  const { optionUploadedFiles } = formData;
  const intl = useIntl();
  const classes = useContext(WizardStylesContext);

  function onPrevious () {
    const newData = {
      optionDescription: getQuillStoredState(editorName),
    };
    updateFormData(newData);
  }

  function onFinish() {
    const newData = {
      optionDescription: getQuillStoredState(editorName),
    };
    updateFormData(newData);
    // due to binding, when the parent on finish is called
    // it might not have the form data at the time of the call.
    // but finish on step buttons always passes along
    // the return value of onNext if it's the last step
    return ({
      ...formData,
      ...newData,
    });
  }

  function onS3Upload (metadatas) {
    const oldUploadedFiles = optionUploadedFiles || [];
    const newUploadedFiles = _.uniqBy([...oldUploadedFiles, ...metadatas], 'path');
    updateFormData({
      optionUploadedFiles: newUploadedFiles
    });
  }

  const editorName = "dialogWizardAddOptionDescriptionStep"
  const editorSpec = {
    onUpload: onS3Upload,
    value: getQuillStoredState(editorName),
    placeholder: intl.formatMessage({ id: 'AddOptionWizardOptionDescriptionPlaceHolder' }),
  };
  const [Editor] = useEditor(editorName, editorSpec)

  return (
    <WizardStepContainer
      {...props}
      titleId="AddOptionWizardOptionDescriptionStepLabel"
    >
      <div>
        <Typography className={classes.introText} variant="body2">
          An Option in a Uclusion Dialog is a choice your collaborators can approve. Don't worry about getting the
          description perfect
          since a collaborator can Ask a Question, make a Suggestion, or propose their own options.
        </Typography>
        {Editor}
        <div className={classes.borderBottom}/>
        <StepButtons
          {...props}
          startOverLabel="AddOptionWizardCancelOption"
          onPrevious={onPrevious}
          onNext={onFinish}
          showFinish={false}
        />
      </div>
    </WizardStepContainer>
  );
}

OptionDescriptionStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

OptionDescriptionStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};

export default OptionDescriptionStep;