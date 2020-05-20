import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import QuillEditor from '../../../../components/TextEditors/QuillEditor';
import { updateValues } from '../../onboardingReducer';
import _ from 'lodash';
import { useIntl } from 'react-intl';
import StepButtons from '../../StepButtons';

function OptionDescriptionStep (props) {
  const { updateFormData, formData, active, classes, onFinish } = props;

  const { dialogReason, dialogReasonUploadedFiles } = formData;
  const [editorContents, setEditorContents] = useState(dialogReason || '');
  const intl = useIntl();

  function onEditorChange (content) {
    setEditorContents(content);
  }

  function onStepChange () {
    updateFormData(updateValues({
      optionDescription: editorContents,
    }));
  }

  function onS3Upload (metadatas) {
    const oldUploadedFiles = dialogReasonUploadedFiles || [];
    const newUploadedFiles = _.uniqBy([...oldUploadedFiles, metadatas], 'path');
    updateFormData(updateValues({
      optionUploadedFiles: newUploadedFiles
    }));
  }
  // we mutate teh data, so we have to
  //ignore the passed in data that finish usually gets
  function myOnFinish(formData) {
    const augmented = {
      ...formData,
      optionDescription: editorContents
    };
    onFinish(augmented);
  }

  if (!active) {
    return React.Fragment;
  }

  const validForm = !_.isEmpty(editorContents);

  return (
    <div>
      <Typography className={classes.introText} variant="body2">
        An Option in a Uclusion Dialog is what your collaborators can vote for or against. It's description
        should provide enough information such that a collaborator can make an informed, useful decision.
        Don't worry about getting the description perfect, however, since a collaborator can Ask a Question,
        make a Suggestion, or propose their own options if they don't like any of yours.
        <QuillEditor
          onChange={onEditorChange}
          defaultValue={editorContents}
          value={editorContents}
          onS3Upload={onS3Upload}
          placeholder={intl.formatMessage({ id: 'AddOptionWizardOptionDescriptionPlaceHolder' })}
        />
      </Typography>
      <div className={classes.borderBottom}/>
      <StepButtons {...props}
                   validForm={validForm}
                   onPrevious={onStepChange}
                   onNext={onStepChange}
                   onFinish={myOnFinish}
      />
    </div>
  );
}

OptionDescriptionStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
  active: PropTypes.bool,
  onFinish: PropTypes.func,
};

OptionDescriptionStep.defaultProps = {
  updateFormData: () => {},
  onFinish: () => {},
  formData: {},
  active: false,
};

export default OptionDescriptionStep;