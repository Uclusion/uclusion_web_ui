import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import QuillEditor from '../../../../../components/TextEditors/QuillEditor'
import { updateValues } from '../../../onboardingReducer'
import _ from 'lodash'
import { useIntl } from 'react-intl'
import StepButtons from '../../../StepButtons'
import { urlHelperGetName } from '../../../../../utils/marketIdPathFunctions'
import { MarketsContext } from '../../../../../contexts/MarketsContext/MarketsContext'
import { InvestiblesContext } from '../../../../../contexts/InvestibesContext/InvestiblesContext'

function InitialRequirementsStep (props) {
  const { updateFormData, formData, active, classes } = props;

  const { workspaceDescription, workspaceDescriptionUploadedFiles } = formData;
  const [editorContents, setEditorContents] = useState(workspaceDescription || '');
  const intl = useIntl();
  const [marketState] = useContext(MarketsContext);
  const [investibleState] = useContext(InvestiblesContext);

  function onEditorChange (content) {
    setEditorContents(content);
  }

  function onStepChange () {
    updateFormData(updateValues({
      workspaceDescription: editorContents,
    }));
  }

  function onS3Upload (metadatas) {
    const oldUploadedFiles = workspaceDescriptionUploadedFiles || [];
    const newUploadedFiles = _.uniqBy([...oldUploadedFiles, ...metadatas], 'path');
    updateFormData(updateValues({
      workspaceDescriptionUploadedFiles: newUploadedFiles
    }));
  }

  if (!active) {
    return React.Fragment;
  }

  const validForm = !_.isEmpty(editorContents);

  return (
    <div>
      <Typography className={classes.introText} variant="body2">
        Uclusion Workspaces have a description which contains contextual information about the project, and is usually where requirements live.
        For now put in any context or initial requirements you have. Every member of the workspace can edit and changes
        automatically notify and display differences to the team.
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
                   onPrevious={onStepChange}
                   onNext={onStepChange}/>
    </div>
  );
}

InitialRequirementsStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
  active: PropTypes.bool,
};

InitialRequirementsStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
  active: false,
};

export default InitialRequirementsStep;