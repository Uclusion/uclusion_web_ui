import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import QuillEditor from '../../TextEditors/QuillEditor';

import _ from 'lodash';
import { useIntl } from 'react-intl';
import StepButtons from '../StepButtons';
import { urlHelperGetName } from '../../../utils/marketIdPathFunctions';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';

function InitiativeDescriptionStep (props) {
  const { updateFormData, formData } = props;

  const { initiativeDescription, initiativeDescriptionUploadedFiles } = formData;
  const [editorContents, setEditorContents] = useState(initiativeDescription || '');
  const intl = useIntl();
  const classes = useContext(WizardStylesContext);
  const [marketState] = useContext(MarketsContext);
  const [investibleState] = useContext(InvestiblesContext);

  function onEditorChange (content) {
    setEditorContents(content);
  }

  function onStepChange () {
    updateFormData({
      initiativeDescription: editorContents,
    });
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
        <QuillEditor
          onChange={onEditorChange}
          defaultValue={editorContents}
          value={editorContents}
          onS3Upload={onS3Upload}
          placeholder={intl.formatMessage({ id: 'InitiativeWizardInitiativeDescriptionPlaceholder' })}
          getUrlName={urlHelperGetName(marketState, investibleState)}
        />
        <div className={classes.borderBottom}></div>
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