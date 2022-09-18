import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { InputAdornment, OutlinedInput, Typography } from '@material-ui/core'
import _ from 'lodash'
import WizardStepContainer from '../WizardStepContainer'
import { WizardStylesContext } from '../WizardStylesContext'
import { createGroup } from '../../../api/markets'
import WorkspaceStepButtons from './WorkspaceStepButtons'
import { addGroupToStorage } from '../../../contexts/MarketGroupsContext/marketGroupsContextHelper'
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext'
import { versionsUpdateGroupMembers } from '../../../contexts/GroupMembersContext/groupMembersContextReducer'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext'

function WorkspaceGroupNameStep (props) {
  const { updateFormData, formData, onboarding, onStartOnboarding } = props;
  const value = formData.groupName || '';
  const validForm = !_.isEmpty(value);
  const classes = useContext(WizardStylesContext);
  const [, groupsDispatch] = useContext(MarketGroupsContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, groupMembersDispatch] = useContext(GroupMembersContext);

  function onNameChange (event) {
    const { value } = event.target;
    updateFormData({
      groupName: value
    });
  }

  function onNext () {
    const { groupName } = formData;
    const groupInfo = {
      name: groupName,
    };
    // set the in onboarding flag, because we if we're onboarding creating the planning market will turn of
    // needs onboarding
    if(onboarding){
      onStartOnboarding();
    }
    return createGroup(formData.marketId, groupInfo)
      .then((response) => {
        const { group, members } = response;
        addGroupToStorage(groupsDispatch, diffDispatch, formData.marketId, group);
        groupMembersDispatch(versionsUpdateGroupMembers(members));
        updateFormData({
          groupId: group.id
        });
      });

  }

  return (
    <WizardStepContainer
      {...props}
    >
      <div>
        <Typography className={classes.introText}>
          What's your team called?
        </Typography>
        <Typography className={classes.introSubText} variant="subtitle1">
          Workspace and group names can be changed at any time.
        </Typography>
        <OutlinedInput
          id="groupName"
          className={classes.input}
          value={value}
          onChange={onNameChange}
          placeholder="Ex: Awesome Ones"
          variant="outlined"
          endAdornment={
            <InputAdornment position={'end'} style={{ marginRight: '1rem' }}>
              {80 - (formData?.groupName?.length ?? 0)}
            </InputAdornment>
          }
        />
        <div className={classes.borderBottom}/>
        <WorkspaceStepButtons {...props} showSkip={true} onNext={onNext} validForm={validForm}/>
      </div>
    </WizardStepContainer>
  );
}

WorkspaceGroupNameStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
  onboarding: PropTypes.bool,
  onStartOnboarding: PropTypes.func,
};

WorkspaceGroupNameStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
  onboarding: false,
  onStartOnboarding: () => {},
};

export default WorkspaceGroupNameStep;