import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core';
import _ from 'lodash';
import StepButtons from '../StepButtons'
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import EmailEntryBox from '../../Email/EmailEntryBox';

function WorkspaceMembersStep(props) {
  const { updateFormData, formData } = props;
  const value = formData.emailList ?? '';
  const validForm = !_.isEmpty(value);
  const classes = useContext(WizardStylesContext);


  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText} variant="h6">
        Who else needs to be in the workspace?
      </Typography>
      <EmailEntryBox placeholder="Enter emails here, separated by spaces"/>
      <div className={classes.borderBottom} />
      <StepButtons {...props} validForm={validForm} showFinish={true} showNext={false}/>
    </div>
    </WizardStepContainer>
  );
}

WorkspaceMembersStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

WorkspaceMembersStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};

export default WorkspaceMembersStep;