import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import _ from 'lodash'
import StepButtons from '../StepButtons'
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import AddNewUsers from '../../../pages/Dialog/UserManagement/AddNewUsers'

function GroupMembersStep(props) {
  const { updateFormData, formData } = props;
  const value = formData.name || '';
  const validForm = !_.isEmpty(value);
  const classes = useContext(WizardStylesContext);
  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText} variant="h6">
        Invite members to your group.
      </Typography>
      <AddNewUsers isAddToGroup setToAddClean={(value) => updateFormData({toAddClean: value})} />
      <div className={classes.borderBottom} />
      <StepButtons {...props} validForm={validForm} showFinish={true} />
    </div>
    </WizardStepContainer>
  );
}

GroupMembersStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

GroupMembersStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};

export default GroupMembersStep;