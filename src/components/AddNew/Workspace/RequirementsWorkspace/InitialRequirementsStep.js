import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import QuillEditor from '../../../TextEditors/QuillEditor';
import _ from 'lodash';
import { useIntl } from 'react-intl';
import StepButtons from '../../StepButtons';
import { urlHelperGetName } from '../../../../utils/marketIdPathFunctions';
import { MarketsContext } from '../../../../contexts/MarketsContext/MarketsContext';
import { InvestiblesContext } from '../../../../contexts/InvestibesContext/InvestiblesContext';
import { WizardStylesContext } from '../../WizardStylesContext';
import WizardStepContainer from '../../WizardStepContainer';
import { doCreateRequirementsWorkspace } from './workspaceCreator';
import { DiffContext } from '../../../../contexts/DiffContext/DiffContext';
import { MarketPresencesContext } from '../../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { VersionsContext } from '../../../../contexts/VersionsContext/VersionsContext';

function InitialRequirementsStep (props) {
  const { updateFormData, formData } = props;
  const classes = useContext(WizardStylesContext);

  const { workspaceDescription, workspaceDescriptionUploadedFiles } = formData;
  const [editorContents, setEditorContents] = useState(workspaceDescription || '');
  const intl = useIntl();

  const [marketState, marketsDispatch] = useContext(MarketsContext);
  const [investibleState] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const [, versionsDispatch] = useContext(VersionsContext);

  function onEditorChange (content) {
    setEditorContents(content);
  }

  function onPrevious () {
    updateFormData({
      workspaceDescription: editorContents,
    });
  }

  function createWorkspace (formData) {
    const dispatchers = {
      marketsDispatch,
      diffDispatch,
      presenceDispatch,
      versionsDispatch,
    };
    return doCreateRequirementsWorkspace(dispatchers, formData, updateFormData)
      .then((marketId) => {
        return ({ ...formData, marketId });
      });
  }


  function myFinish () {
    const newValues = {
      workspaceDescription: editorContents,
    };
    updateFormData(newValues);
    return createWorkspace({ ...formData, ...newValues });
  }

  function onS3Upload (metadatas) {
    const oldUploadedFiles = workspaceDescriptionUploadedFiles || [];
    const newUploadedFiles = _.uniqBy([...oldUploadedFiles, ...metadatas], 'path');
    updateFormData({
      workspaceDescriptionUploadedFiles: newUploadedFiles
    });
  }

  const validForm = !_.isEmpty(editorContents);

  return (
    <WizardStepContainer
      {...props}
      titleId="ReqWorkspaceWizardRequirementsStepLabel"
    >
      <div>
        <Typography className={classes.introText} variant="body2">
          Uclusion Workspaces have a description which contains contextual information, and is usually where project
          requirements live.
          Or you might be using the Workspace for your team's base of operations or to discuss some topic important to
          your team.
          Every member of the workspace can edit and changes automatically notify and display differences to the team.
        </Typography>
        <QuillEditor
          onChange={onEditorChange}
          defaultValue={editorContents}
          value={editorContents}
          onS3Upload={onS3Upload}
          placeholder={intl.formatMessage({ id: 'ReqWorkspaceWizardInitialRequirementsPlaceHolder' })}
          getUrlName={urlHelperGetName(marketState, investibleState)}
        />
        <div className={classes.borderBottom}></div>
        <StepButtons {...props}
                     validForm={validForm}
                     onNext={myFinish}
                     onPrevious={onPrevious}/>
      </div>
    </WizardStepContainer>
  );
}

InitialRequirementsStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

InitialRequirementsStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};

export default InitialRequirementsStep;