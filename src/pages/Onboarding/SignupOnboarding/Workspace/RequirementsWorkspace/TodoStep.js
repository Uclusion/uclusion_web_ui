import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';
import _ from 'lodash';
import StepButtons from '../../../StepButtons';
import QuillEditor from '../../../../../components/TextEditors/QuillEditor';
import { updateValues } from '../../../onboardingReducer';


function TodoStep (props) {
  const { updateFormData, formData, active, classes } = props;
  const intl = useIntl();
  const {
    todo,
    todoUploadedFiles,
  } = formData;
  const [editorContents, setEditorContents] = useState(todo);
  const validForm =  !_.isEmpty(editorContents);


  if (!active) {
    return React.Fragment;
  }

  function onEditorChange(content) {
    setEditorContents(content);
  }

  function onS3Upload(metadatas) {
    const oldUploadedFiles = todoUploadedFiles || []
    const newUploadedFiles = _.uniqBy([...oldUploadedFiles, metadatas], 'path');
    updateFormData(updateValues({
      todoUploadedFiles: newUploadedFiles
    }));
  }

  function onStepChange() {
    updateFormData(updateValues({
      todo: editorContents,
      todoSkipped: false,
    }));
  }

  function onSkip() {
    updateFormData(updateValues({
      todo: editorContents,
      todoSkipped: true,
    }));
  }

  return (
    <div>
      <Typography variant="body2">
        Workspaces allow collaborators to create TODOs that spell out what needs to be done before things can move forward.
        If you know of one, enter it below. Otherwise TODOs can be added to the Workspace later.
      </Typography>
      <QuillEditor
        placeholder={intl.formatMessage({ id: 'ReqWorkspaceWizardTodoPlaceholder'})}
        value={editorContents}
        defaultValue={editorContents}
        onS3Upload={onS3Upload}
        onChange={onEditorChange}
      />
      <div className={classes.borderBottom}></div>
      <StepButtons {...props}
                   validForm={validForm}
                   onPrevious={onStepChange}
                   showSkip
                   onSkip={onSkip}
                   onNext={onStepChange}/>
    </div>
  );
}

TodoStep.propTypes = {
  updateFormData: PropTypes.func.isRequired,
  formData: PropTypes.object.isRequired,
  active: PropTypes.bool.isRequired,
};

TodoStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
  active: false,
};
export default TodoStep;