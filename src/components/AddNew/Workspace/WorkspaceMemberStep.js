import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core';
import _ from 'lodash';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import EmailEntryBox from '../../Email/EmailEntryBox';
import WorkspaceStepButtons from './WorkspaceStepButtons';

function WorkspaceMembersStep(props) {
  const { updateFormData, formData } = props;
  const value = formData.emails ?? '';
  const validForm = !_.isEmpty(value);
  const classes = useContext(WizardStylesContext);

  const onEmailChange = (emails) => {
    updateFormData({
      emails
    });
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText} variant="h6">
        Who else needs to be in the workspace?
      </Typography>
      <EmailEntryBox onChange={onEmailChange} placeholder="Ex: bfollis@uclusion.com, disrael@uclusion.com"/>
      <div className={classes.borderBottom} />
      <WorkspaceStepButtons {...props} validForm={validForm} showSkip={true} showLink={true} formData={formData }/>
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