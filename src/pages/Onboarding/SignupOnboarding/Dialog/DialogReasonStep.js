import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import QuillEditor from '../../../../components/TextEditors/QuillEditor'
import { updateValues } from '../../onboardingReducer'
import _ from 'lodash'
import { useIntl } from 'react-intl'
import StepButtons from '../../StepButtons'
import { urlHelperGetName } from '../../../../utils/marketIdPathFunctions'
import { MarketsContext } from '../../../../contexts/MarketsContext/MarketsContext'
import { InvestiblesContext } from '../../../../contexts/InvestibesContext/InvestiblesContext'

function DialogReasonStep (props) {
  const { updateFormData, formData, active, classes } = props;

  const { dialogReason, dialogReasonUploadedFiles } = formData;
  const [editorContents, setEditorContents] = useState(dialogReason || '');
  const intl = useIntl();
  const [marketState] = useContext(MarketsContext);
  const [investibleState] = useContext(InvestiblesContext);

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
    const newUploadedFiles = _.uniqBy([...oldUploadedFiles, ...metadatas], 'path');
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
        Provide a context for the Dialog by entering below.
      </Typography>
      <QuillEditor
        onChange={onEditorChange}
        defaultValue={editorContents}
        value={editorContents}
        onS3Upload={onS3Upload}
        placeholder={intl.formatMessage({ id: 'DialogWizardReasonPlaceHolder' })}
        getUrlName={urlHelperGetName(marketState, investibleState)}
      />
      <div className={classes.borderBottom}></div>
      <StepButtons {...props}
                   validForm={validForm}
                   showSkip={true}
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