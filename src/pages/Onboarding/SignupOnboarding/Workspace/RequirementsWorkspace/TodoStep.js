import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import { useIntl } from 'react-intl'
import _ from 'lodash'
import StepButtons from '../../../StepButtons'
import QuillEditor from '../../../../../components/TextEditors/QuillEditor'
import { updateValues } from '../../../onboardingReducer'
import { urlHelperGetName } from '../../../../../utils/marketIdPathFunctions'
import { MarketsContext } from '../../../../../contexts/MarketsContext/MarketsContext'
import { InvestiblesContext } from '../../../../../contexts/InvestibesContext/InvestiblesContext'
import { DiffContext } from '../../../../../contexts/DiffContext/DiffContext';
import { MarketPresencesContext } from '../../../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { VersionsContext } from '../../../../../contexts/VersionsContext/VersionsContext';
import { CommentsContext } from '../../../../../contexts/CommentsContext/CommentsContext';
import { doCreateRequirementsWorkspace } from './workspaceCreator';

function TodoStep (props) {
  const { updateFormData, formData, active, classes, setOperationStatus } = props;
  const intl = useIntl();
  const [marketState, marketsDispatch] = useContext(MarketsContext);
  const [investibleState] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const [, versionsDispatch] = useContext(VersionsContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);

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
    const newUploadedFiles = _.uniqBy([...oldUploadedFiles, ...metadatas], 'path');
    updateFormData(updateValues({
      todoUploadedFiles: newUploadedFiles
    }));
  }

  function createWorkspace(formData) {
    const dispatchers = {
      marketsDispatch,
      diffDispatch,
      presenceDispatch,
      versionsDispatch,
      commentsState,
      commentsDispatch
    };
    doCreateRequirementsWorkspace(dispatchers, formData, updateFormData, setOperationStatus)
  }


  function onPrevious() {
    updateFormData(updateValues({
      todo: editorContents,
      todoSkipped: false,
    }));
  }

  function onNext() {
    const newValues = {
      todo: editorContents,
      todoSkipped: false,
    };
    updateFormData(updateValues(newValues));
    return createWorkspace({...formData, ...newValues});
  }

  function onSkip() {
    const newValues = {
      todo: editorContents,
      todoSkipped: true,
    };
    updateFormData(updateValues(newValues));
    return createWorkspace({...formData, ...newValues});
  }

  return (
    <div>
      <Typography variant="body2" className={classes.marginBottom}>
        Workspaces allow collaborators to create TODOs that spell out what needs to be done before things can move forward.
        If you know of one, enter it below. Otherwise TODOs can be added to the Workspace later.
      </Typography>
      <QuillEditor
        placeholder={intl.formatMessage({ id: 'ReqWorkspaceWizardTodoPlaceholder'})}
        value={editorContents}
        defaultValue={editorContents}
        onS3Upload={onS3Upload}
        onChange={onEditorChange}
        getUrlName={urlHelperGetName(marketState, investibleState)}
      />
      <div className={classes.borderBottom}></div>
      <StepButtons {...props}
                   validForm={validForm}
                   onPrevious={onPrevious}
                   showSkip
                   onSkip={onSkip}
                   onNext={onNext}/>
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