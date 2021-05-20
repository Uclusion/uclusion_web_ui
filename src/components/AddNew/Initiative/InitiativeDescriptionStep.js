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

function InitiativeDescriptionStep (props) {
  const { updateFormData, formData } = props;

  const { initiativeDescriptionUploadedFiles } = formData;
  const intl = useIntl();
  const classes = useContext(WizardStylesContext);

  const editorName = 'initiativeDescriptionStep';
  const editorSpec = {
    onUpload: onS3Upload,
    value: getQuillStoredState(editorName),
    placeholder: intl.formatMessage({ id: 'InitiativeWizardInitiativeDescriptionPlaceholder' })
  };
  const [Editor] = useEditor(editorName, editorSpec);


  function onStepChange () {
    updateFormData({
      initiativeDescription: getQuillStoredState(editorName)
    });
  }

  function onS3Upload (metadatas) {
    const oldUploadedFiles = initiativeDescriptionUploadedFiles || [];
    const newUploadedFiles = _.uniqBy([...oldUploadedFiles, ...metadatas], 'path');
    updateFormData({
      initiativeDescriptionUploadedFiles: newUploadedFiles
    });
  }

  return (
    <WizardStepContainer
      {...props}
      titleId="InitiativeWizardInitiativeDescriptionStepLabel"
    >
      <div>
        <Typography className={classes.introText} variant="body2">
          Uclusion Initiatives handle the process of gathering votes but voters need a detailed description of the idea.
          Enter the description below. If voters don't understand they can ask Questions or make Suggestions if the idea
          needs tweaking.
        </Typography>
        {Editor}
        <div className={classes.borderBottom}/>
        <StepButtons {...props}
                     showSkip={true}
                     showFinish={false}
                     onPrevious={onStepChange}
                     onNext={onStepChange}/>
      </div>
    </WizardStepContainer>
  );
}

InitiativeDescriptionStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

InitiativeDescriptionStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};

export default InitiativeDescriptionStep;