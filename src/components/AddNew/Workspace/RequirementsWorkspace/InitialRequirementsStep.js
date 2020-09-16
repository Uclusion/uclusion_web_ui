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

function InitialRequirementsStep (props) {
  const { updateFormData, formData, active } = props;
  const classes = useContext(WizardStylesContext);

  const { workspaceDescription, workspaceDescriptionUploadedFiles } = formData;
  const [editorContents, setEditorContents] = useState(workspaceDescription || '');
  const intl = useIntl();
  const [marketState] = useContext(MarketsContext);
  const [investibleState] = useContext(InvestiblesContext);

  function onEditorChange (content) {
    setEditorContents(content);
  }

  function onStepChange () {
    updateFormData({
      workspaceDescription: editorContents,
    });
  }

  function onS3Upload (metadatas) {
    const oldUploadedFiles = workspaceDescriptionUploadedFiles || [];
    const newUploadedFiles = _.uniqBy([...oldUploadedFiles, ...metadatas], 'path');
    updateFormData({
      workspaceDescriptionUploadedFiles: newUploadedFiles
    });
  }

  if (!active) {
    return React.Fragment;
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
                     onNext={onStepChange}
                     onPrevious={onStepChange}/>
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