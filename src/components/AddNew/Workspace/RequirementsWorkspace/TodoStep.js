import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import { useIntl } from 'react-intl';
import _ from 'lodash';
import StepButtons from '../../StepButtons';
import QuillEditor from '../../../TextEditors/QuillEditor';
import {
  urlHelperGetName
} from '../../../../utils/marketIdPathFunctions';
import { MarketsContext } from '../../../../contexts/MarketsContext/MarketsContext';
import { InvestiblesContext } from '../../../../contexts/InvestibesContext/InvestiblesContext';
import { DiffContext } from '../../../../contexts/DiffContext/DiffContext';
import { MarketPresencesContext } from '../../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { VersionsContext } from '../../../../contexts/VersionsContext/VersionsContext';
import { CommentsContext } from '../../../../contexts/CommentsContext/CommentsContext';
import { doCreateRequirementsWorkspace } from './workspaceCreator';
import WizardStepContainer from '../../WizardStepContainer';
import { WizardStylesContext } from '../../WizardStylesContext';

function TodoStep (props) {
  const { updateFormData, formData} = props;
  const classes = useContext(WizardStylesContext);
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
  const validForm = !_.isEmpty(editorContents);

  function onEditorChange (content) {
    setEditorContents(content);
  }

  function onS3Upload (metadatas) {
    const oldUploadedFiles = todoUploadedFiles || [];
    const newUploadedFiles = _.uniqBy([...oldUploadedFiles, ...metadatas], 'path');
    updateFormData({
      todoUploadedFiles: newUploadedFiles
    });
  }

  function createWorkspace (formData) {
    const dispatchers = {
      marketsDispatch,
      diffDispatch,
      presenceDispatch,
      versionsDispatch,
      commentsState,
      commentsDispatch
    };
    return doCreateRequirementsWorkspace(dispatchers, formData, updateFormData)
      .then((marketId) => {
        return ({ ...formData, marketId });
      });
  }

  function onPrevious () {
    updateFormData({
      todo: editorContents,
      todoSkipped: false,
    });
  }

  function myFinish () {
    const newValues = {
      todo: editorContents,
      todoSkipped: false,
    };
    updateFormData(newValues);
    return createWorkspace({ ...formData, ...newValues });
  }

  function onSkip () {
    const newValues = {
      todo: editorContents,
      todoSkipped: true,
    };
    updateFormData(newValues);
    return createWorkspace({ ...formData, ...newValues });
  }

  return (
    <WizardStepContainer
      {...props}
      titleId="ReqWorkspaceWizardTodoStepLabel"
    >
      <div>
        <Typography variant="body2" className={classes.marginBottom}>
          Workspaces allow collaborators to create TODOs that spell out what needs to be done before things can move
          forward.
          If you know of one, enter it below. Otherwise TODOs can be added to the Workspace later.
        </Typography>
        <QuillEditor
          placeholder={intl.formatMessage({ id: 'ReqWorkspaceWizardTodoPlaceholder' })}
          value={editorContents}
          defaultValue={editorContents}
          onS3Upload={onS3Upload}
          onChange={onEditorChange}
          getUrlName={urlHelperGetName(marketState, investibleState)}
        />
        <div className={classes.borderBottom}></div>
        <StepButtons {...props}
                     validForm={validForm}
                     spinOnClick
                     onPrevious={onPrevious}
                     showSkip
                     onSkip={onSkip}
                     onNext={myFinish}/>
      </div>
    </WizardStepContainer>
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