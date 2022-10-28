import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import _ from 'lodash'
import WizardStepContainer from '../WizardStepContainer'
import { WizardStylesContext } from '../WizardStylesContext'
import AddNewUsers from '../../../pages/Dialog/UserManagement/AddNewUsers'
import WizardStepButtons from '../WizardStepButtons'
import { changeGroupParticipation} from '../../../api/markets'

function GroupMembersStep (props) {
  const { updateFormData, formData, marketId } = props
  const validForm = !_.isEmpty(formData.toAddClean)
  const classes = useContext(WizardStylesContext)
  const groupText = formData.name ?? 'your group'

  function onNext() {
    const {groupId} = formData;
    const follows = formData.toAddClean.map((user) => {
      return {
        is_following: true,
        user_id: user.user_id,
      }
    });
    return changeGroupParticipation(marketId, groupId, follows);
  }

  function onTerminate() {
    return onNext();
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <div>
        <Typography className={classes.introText} variant="h6">
          Who should be in {groupText}?
        </Typography>
        <AddNewUsers isAddToGroup setToAddClean={(value) => updateFormData({ toAddClean: value })}/>
        <div className={classes.borderBottom}/>
        <WizardStepButtons
          {...props}
          validForm={validForm}
          onNext={onNext}
          nextLabel="GroupWizardConfigureApprovals"
          onTerminate={onTerminate}
          showTerminate={true}
          terminateLabel="GroupWizardGotoGroup"/>
      </div>
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