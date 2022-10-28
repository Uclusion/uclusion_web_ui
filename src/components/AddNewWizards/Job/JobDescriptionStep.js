import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import _ from 'lodash'
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { getQuillStoredState, resetEditor } from '../../TextEditors/Utilities/CoreUtils'
import { useEditor } from '../../TextEditors/quillHooks'
import { nameFromDescription } from '../../../utils/stringFunctions'
import { addPlanningInvestible } from '../../../api/investibles'
import { formInvestibleLink } from '../../../utils/marketIdPathFunctions'


function JobDescriptionStep (props) {
  const {marketId, groupId, updateFormData, onFinish} = props;
  const editorName = "addJobWizard"
  const [value, setValue] = useState(getQuillStoredState(editorName));
  const validForm = !_.isEmpty(value);
  const classes = useContext(WizardStylesContext);


  const editorSpec = {
    placeholder: "Ex: make magic happen via A, B, C",
    value,
    marketId,
    onChange: setValue,
  };

  const [Editor] = useEditor(editorName, editorSpec);

  function createJob() {
    const addInfo = {
      name: nameFromDescription(value),
      description: value,
      groupId,
      marketId,
    }
    return addPlanningInvestible(addInfo)
      .then((inv) => {
        const { id: investibleId } = inv.investible;
        // reset the editor box
        const link = formInvestibleLink(marketId, investibleId);
        resetEditor(editorName);
        // update the form data with the saved investible
        updateFormData({
          investibleId,
          link,
        });
        return link;
      })
  }

  function myOnFinish(formData){
     createJob()
      .then((link) => {
        onFinish({
          ...formData,
          link
        });
      });
  }



  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        What has to be done?
      </Typography>
      {Editor}
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        validForm={validForm}
        nextLabel="JobWizardAssignJob"
        onNext={createJob}
        onTerminate={myOnFinish}
        showTerminate={validForm}
        terminateLabel="JobWizardGotoJob"/>
    </div>
    </WizardStepContainer>
  );
}

JobDescriptionStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

JobDescriptionStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default JobDescriptionStep;