import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { TextField, Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';
import _ from 'lodash';
import StepButtons from '../../StepButtons';
import QuillEditor from '../../../TextEditors/QuillEditor';
import { urlHelperGetName } from '../../../../utils/marketIdPathFunctions';
import { MarketsContext } from '../../../../contexts/MarketsContext/MarketsContext';
import { InvestiblesContext } from '../../../../contexts/InvestibesContext/InvestiblesContext';
import { WizardStylesContext } from '../../WizardStylesContext';
import WizardStepContainer from '../../WizardStepContainer';
import { useEditor } from '../../../TextEditors/quillHooks';

function CurrentStoryStep (props) {
  const { updateFormData, formData } = props;
  const intl = useIntl();
  const classes = useContext(WizardStylesContext);
  const {
    currentStoryName,
    currentStoryDescription,
    currentStoryUploadedFiles,
  } = formData;
  const [editorContents, setEditorContents] = useState(currentStoryDescription);
  const storyName = currentStoryName || '';
  const validForm = !_.isEmpty(currentStoryName);

  const editorName = "CurrentStoryStep-editor";
  const editorSpec = {
    onUpload: onS3Upload,
    onChange: onEditorChange,
    dontManageState: true,
    value: editorContents,
    placeholder: intl.formatMessage({ id: 'OnboardingWizardCurrentStoryDescriptionPlaceHolder' }),
  }

  const [Editor] = useEditor(editorName, editorSpec);

  function onNameChange (event) {
    const { value } = event.target;
    updateFormData({
      currentStoryName: value
    });
  }

  function onEditorChange (content) {
    setEditorContents(content);
  }

  function onS3Upload (metadatas) {
    const oldUploadedFiles = currentStoryUploadedFiles || [];
    const newUploadedFiles = _.uniqBy([...oldUploadedFiles, ...metadatas], 'path');
    updateFormData({
      currentStoryUploadedFiles: newUploadedFiles
    });
  }

  function onStepChange () {
    updateFormData({
      currentStoryDescription: editorContents,
    });
  }

  return (
    <WizardStepContainer
      {...props}
      titleId="OnboardingWizardCurrentStoryStepLabel"
    >
      <div>
        <Typography variant="body2">
          What story are you currently working on? This will become your "In Progress" story, and will let everyone see
          the
          story and make Suggestions, note TODOs, ask Questions, and raise Blocking Issues.
        </Typography>
        <label className={classes.inputLabel}
               htmlFor="story-name">{intl.formatMessage({ id: 'OnboardingWizardCurrentStoryNamePlaceHolder' })}</label>
        <TextField
          id="story-name"
          className={classes.input}
          value={storyName}
          onChange={onNameChange}
        />
        {Editor}
        <div className={classes.borderBottom}/>
        <StepButtons {...props}
                     validForm={validForm}
                     onPrevious={onStepChange}
                     onNext={onStepChange}/>
      </div>
    </WizardStepContainer>
  );
}

CurrentStoryStep.propTypes = {
  updateFormData: PropTypes.func.isRequired,
  formData: PropTypes.object.isRequired,
};

CurrentStoryStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};
export default CurrentStoryStep;