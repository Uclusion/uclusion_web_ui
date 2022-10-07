import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import _ from 'lodash'
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import AddNewUsers from '../../../pages/Dialog/UserManagement/AddNewUsers'
import WizardStepButtons from '../WizardStepButtons';

function GroupMembersStep(props) {
  const { updateFormData, formData } = props;
  const value = formData.name || '';
  const validForm = !_.isEmpty(value);
  const classes = useContext(WizardStylesContext);
  const groupText = formData.name ?? 'your group';
  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText} variant="h6">
        Who should be in {groupText}?
      </Typography>
      <AddNewUsers isAddToGroup setToAddClean={(value) => updateFormData({toAddClean: value})} />
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        validForm={validForm}
        nextLabel='GroupWizardConfigureApprovals'
        showFinish={true}
        finishLabel='GroupWizardGotoGroup'/>
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