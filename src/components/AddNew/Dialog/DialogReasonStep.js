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
import { useEditor } from '../../TextEditors/quillHooks';

function DialogReasonStep (props) {
  const { updateFormData, formData } = props;
  const { dialogReason, dialogReasonUploadedFiles } = formData;
  const [editorContents, setEditorContents] = useState(dialogReason || '');
  const intl = useIntl();
  const classes = useContext(WizardStylesContext);
  const [marketState] = useContext(MarketsContext);
  const [investibleState] = useContext(InvestiblesContext);

  function onEditorChange (content) {
    setEditorContents(content);
  }

  function onS3Upload (metadatas) {
    const oldUploadedFiles = dialogReasonUploadedFiles || [];
    const newUploadedFiles = _.uniqBy([...oldUploadedFiles, ...metadatas], 'path');
    updateFormData({
      dialogReasonUploadedFiles: newUploadedFiles
    });
  }

  const editorName = "DialogReasonStep-editor"
  const editorSpec = {
    onChange: onEditorChange,
    dontManageState: true,
    onUpload: onS3Upload,
    value: editorContents,
    placeholder: intl.formatMessage({ id: 'DialogWizardReasonPlaceHolder' }),
    getUrlName: urlHelperGetName(marketState, investibleState),
  }

  const [Editor] = useEditor(editorName, editorSpec);

  function onStepChange () {
    updateFormData({
      dialogReason: editorContents,
    });
  }



  const validForm = !_.isEmpty(editorContents);

  return (
    <WizardStepContainer
      {...props}
      titleId="DialogWizardDialogReasonStepLabel"
    >
      <div>
        <Typography className={classes.introText} variant="body2">
          Provide a context for the Dialog by entering below.
        </Typography>
        {Editor}
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

DialogReasonStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

DialogReasonStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};

export default DialogReasonStep;