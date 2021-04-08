import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';

import _ from 'lodash';
import { useIntl } from 'react-intl';
import StepButtons from '../StepButtons';
import { urlHelperGetName } from '../../../utils/marketIdPathFunctions';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import { editorReset, useEditor } from '../../TextEditors/quillHooks';

function InitiativeDescriptionStep (props) {
  const { updateFormData, formData } = props;

  const { initiativeDescription, initiativeDescriptionUploadedFiles } = formData;
  const [editorContents, setEditorContents] = useState(initiativeDescription || '');
  const intl = useIntl();
  const classes = useContext(WizardStylesContext);
  const [marketState] = useContext(MarketsContext);
  const [investibleState] = useContext(InvestiblesContext);

  const editorName = 'initiativeDescriptionStep';

  const getUrlName = urlHelperGetName(marketState, investibleState);
  const editorSpec = {
    onChange: setEditorContents,
    onUpload: onS3Upload,
    getUrlName,
    value: initiativeDescription,
    placeholder: intl.formatMessage({ id: 'InitiativeWizardInitiativeDescriptionPlaceholder' })
  };
  const [Editor, editorController] = useEditor(editorName, editorSpec);


  function onStepChange () {
    updateFormData({
      initiativeDescription: editorContents,
    });
    // the stateis in the form data, so we want to force the editor to reset
    editorController(editorReset());
  }

  function onS3Upload (metadatas) {
    const oldUploadedFiles = initiativeDescriptionUploadedFiles || [];
    const newUploadedFiles = _.uniqBy([...oldUploadedFiles, ...metadatas], 'path');
    updateFormData({
      initiativeDescriptionUploadedFiles: newUploadedFiles
    });
  }

  const validForm = !_.isEmpty(editorContents);
  return (
    <WizardStepContainer
      {...props}
      titleId="InitiativeWizardInitiativeDescriptionStepLabel"
    >
      <div>
        <Typography className={classes.introText} variant="body2">
          Uclusion Initiatives handle the process of gathering votes but voters need a detailed description of the idea.
          Enter the description below. If voters don't understand they can ask Questions or make Suggestions if the idea
          needs tweaking.
        </Typography>
        {Editor}
        <div className={classes.borderBottom}/>
        <StepButtons {...props}
                     validForm={validForm}
                     showSkip={true}
                     showFinish={false}
                     onPrevious={onStepChange}
                     onNext={onStepChange}/>
      </div>
    </WizardStepContainer>
  );
}

InitiativeDescriptionStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

InitiativeDescriptionStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};

export default InitiativeDescriptionStep;