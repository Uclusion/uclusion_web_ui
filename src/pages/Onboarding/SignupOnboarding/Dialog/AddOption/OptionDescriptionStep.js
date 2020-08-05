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

function OptionDescriptionStep (props) {
  const { updateFormData, formData, active, classes, onFinish } = props;
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
      optionDescription: editorContents,
    }));
  }

  function onS3Upload (metadatas) {
    const oldUploadedFiles = dialogReasonUploadedFiles || [];
    const newUploadedFiles = _.uniqBy([...oldUploadedFiles, metadatas], 'path');
    updateFormData(updateValues({
      optionUploadedFiles: newUploadedFiles
    }));
  }
  // we mutate teh data, so we have to
  //ignore the passed in data that finish usually gets
  function myOnFinish(formData) {
    const augmented = {
      ...formData,
      optionDescription: editorContents
    };
    onFinish(augmented);
  }

  if (!active) {
    return React.Fragment;
  }

  return (
    <div>
      <Typography className={classes.introText} variant="body2">
        An Option in a Uclusion Dialog is a choice your collaborators can approve. Don't worry about getting the description perfect
        since a collaborator can Ask a Question, make a Suggestion, or propose their own options.
      </Typography>
      <QuillEditor
        onChange={onEditorChange}
        defaultValue={editorContents}
        value={editorContents}
        onS3Upload={onS3Upload}
        placeholder={intl.formatMessage({ id: 'AddOptionWizardOptionDescriptionPlaceHolder' })}
        getUrlName={urlHelperGetName(marketState, investibleState)}
      />
      <div className={classes.borderBottom}/>
      <StepButtons {...props}
                   onPrevious={onStepChange}
                   onNext={onStepChange}
                   onFinish={myOnFinish}
      />
    </div>
  );
}

OptionDescriptionStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
  active: PropTypes.bool,
  onFinish: PropTypes.func,
};

OptionDescriptionStep.defaultProps = {
  updateFormData: () => {},
  onFinish: () => {},
  formData: {},
  active: false,
};

export default OptionDescriptionStep;