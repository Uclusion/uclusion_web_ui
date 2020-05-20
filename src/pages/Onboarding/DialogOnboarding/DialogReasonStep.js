import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import QuillEditor from '../../../components/TextEditors/QuillEditor';
import { updateValues } from '../onboardingReducer';
import _ from 'lodash';
import { useIntl } from 'react-intl';
import StepButtons from '../StepButtons';

function DialogReasonStep (props) {
  const { updateFormData, formData, active, classes } = props;

  const { dialogReason, dialogReasonUploadedFiles } = formData;
  const [editorContents, setEditorContents] = useState(dialogReason || '');
  const intl = useIntl();

  function onEditorChange (content) {
    setEditorContents(content);
  }

  function onStepChange () {
    updateFormData(updateValues({
      dialogReason: editorContents,
    }));
  }

  function onS3Upload (metadatas) {
    const oldUploadedFiles = dialogReasonUploadedFiles || [];
    const newUploadedFiles = _.uniqBy([...oldUploadedFiles, metadatas], 'path');
    updateFormData(updateValues({
      dialogReasonUploadedFiles: newUploadedFiles
    }));
  }

  if (!active) {
    return React.Fragment;
  }

  const validForm = !_.isEmpty(editorContents);

  return (
    <div>
      <Typography className={classes.introText} variant="body2">
        Uclusion Dialogs can provide context outside of the options to help guide the decision.
        Why the decision has to be made is a great thing to put in the context, which can be entered
        below.
        <QuillEditor
          onChange={onEditorChange}
          defaultValue={editorContents}
          value={editorContents}
          onS3Upload={onS3Upload}
          placeholder={intl.formatMessage({ id: 'DialogWizardReasonPlaceHolder' })}
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

DialogReasonStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
  active: PropTypes.bool,
};

DialogReasonStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
  active: false,
};

export default DialogReasonStep;