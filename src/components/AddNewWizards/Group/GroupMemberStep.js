import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import _ from 'lodash';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import AddNewUsers from '../../../pages/Dialog/UserManagement/AddNewUsers';
import WizardStepButtons from '../WizardStepButtons';
import { changeGroupParticipation } from '../../../api/markets';
import { navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { modifyGroupMembers } from '../../../contexts/GroupMembersContext/groupMembersContextReducer';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';

function GroupMembersStep (props) {
  const { updateFormData, formData, marketId } = props
  const [, groupMembersDispatch] = useContext(GroupMembersContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const history = useHistory();
  const validForm = !_.isEmpty(formData.toAddClean)
  const classes = useContext(WizardStylesContext)
  const groupText = formData.name ?? 'your group'

  function onNext() {
    const {groupId} = formData;
    const follows = formData.toAddClean?.map((user) => {
      return {
        is_following: true,
        user_id: user.user_id,
      }
    });
    if((follows?.length ?? 0) > 0) {
      return changeGroupParticipation(marketId, groupId, follows).then((members)=>{
        setOperationRunning(false);
        groupMembersDispatch(modifyGroupMembers(groupId, members));
      });
    }
    return Promise.resolve(true);
  }

  function onTerminate() {
    return onNext()
      .then(() => {
        const {link} = formData;
        navigate(history, link);
      })
  }

  return (
    <WizardStepContainer
      {...props}
    >
        <Typography className={classes.introText} variant="h6">
          Who should be in {groupText}?
        </Typography>
        <AddNewUsers setToAddClean={(value) => updateFormData({ toAddClean: value })}/>
        <div className={classes.borderBottom}/>
        <WizardStepButtons
          {...props}
          validForm={validForm}
          onNext={onNext}
          nextLabel="GroupWizardAddMembers"
          onTerminate={onTerminate}
          showTerminate={true}
          terminateLabel="GroupWizardGotoGroup"/>
    </WizardStepContainer>
  )
}

GroupMembersStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
}

GroupMembersStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
}

export default GroupMembersStep