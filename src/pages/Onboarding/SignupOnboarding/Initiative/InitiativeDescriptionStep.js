import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import QuillEditor from '../../../../components/TextEditors/QuillEditor';
import { updateValues } from '../../onboardingReducer';
import _ from 'lodash';
import { useIntl } from 'react-intl';
import StepButtons from '../../StepButtons';

function InitiativeDescriptionStep (props) {
  const { updateFormData, formData, active, classes } = props;

  const { initiativeDescription, initiativeDescriptionUploadedFiles } = formData;
  const [editorContents, setEditorContents] = useState(initiativeDescription || '');
  const intl = useIntl();

  function onEditorChange (content) {
    setEditorContents(content);
  }

  function onStepChange () {
    updateFormData(updateValues({
      initiativeDescription: editorContents,
    }));
  }

  function onS3Upload (metadatas) {
    const oldUploadedFiles = initiativeDescriptionUploadedFiles || [];
    const newUploadedFiles = _.uniqBy([...oldUploadedFiles, metadatas], 'path');
    updateFormData(updateValues({
      initiativeDescriptionUploadedFiles: newUploadedFiles
    }));
  }

  if (!active) {
    return React.Fragment;
  }

  const validForm = !_.isEmpty(editorContents);

  return (
    <div>
      <Typography className={classes.introText} variant="body2">
        Uclusion Initiatives will handle the process of gathering votes and making sure everyone can track what's going on,
        but voters will want a detailed description of the idea. Enter the description below, but don't stress to much about
        getting every detail right. Uclusion allows your voters to ask Questions if they don't understand something.
        <QuillEditor
          onChange={onEditorChange}
          defaultValue={editorContents}
          value={editorContents}
          onS3Upload={onS3Upload}
          placeholder={intl.formatMessage({ id: 'InitiativeWizardInitiativeDescriptionPlaceholder' })}
        />
      </Typography>
      <div className={classes.borderBottom}></div>
      <StepButtons {...props}
                   validForm={validForm}
                   onPrevious={onStepChange}
                   onNext={onStepChange}/>
    </div>
  );
}

InitiativeDescriptionStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
  active: PropTypes.bool,
};

InitiativeDescriptionStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
  active: false,
};

export default InitiativeDescriptionStep;