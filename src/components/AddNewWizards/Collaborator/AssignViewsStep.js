import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import { setEmailList } from '../../Email/EmailEntryBox';
import WizardStepButtons from '../WizardStepButtons';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import _ from 'lodash';
import { changeGroupParticipation } from '../../../api/markets';
import { modifyGroupMembers } from '../../../contexts/GroupMembersContext/groupMembersContextReducer';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';
import IdentityList from '../../Email/IdentityList';
import Link from '@material-ui/core/Link';
import { getGroupPresences, isAutonomousGroup } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';

function AssignViewsStep(props) {
  const { finish, marketId, marketPresences, updateFormData, formData } = props;
  const [groupsState] = useContext(MarketGroupsContext);
  const [groupMembersState, groupPresencesDispatch] = useContext(GroupMembersContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const classes = useContext(WizardStylesContext);
  const [checked, setChecked] = useState([]);
  const { groupIdIndex, emails } = formData;
  // Clean up from the previous step
  setEmailList([], marketId);
  // Screen out autonomous as don't encourage adding to them
  const groupsFiltered = groupsState[marketId]?.filter((group) => {
    const groupPresences = getGroupPresences(marketPresences, groupMembersState, marketId, group.id);
    return !isAutonomousGroup(groupPresences, group) && group.group_type !== 'EVERYONE';
  });
  // Active and inactive treated the same - inactive so rare anyway
  const groupsSorted = _.sortBy(groupsFiltered, 'name');
  if (_.isEmpty(groupsSorted)) {
    return React.Fragment;
  }
  const group = groupsSorted[groupIdIndex];
  const presences = marketPresences.filter((presence) => emails?.includes(presence.email));
  const hasMoreGroups = groupIdIndex + 1 < groupsSorted.length;

  function onAssignmentChange(users) {
    setChecked(users);
  }

  function next() {
    if (!_.isEmpty(checked)) {
      const newChecked = checked.map((presence) => {
        return {user_id: presence.id, is_following: true}
      });
      return changeGroupParticipation(marketId, group.id, newChecked).then((modified) => {
        groupPresencesDispatch(modifyGroupMembers(group.id, modified));
        setOperationRunning(false);
        if (hasMoreGroups) {
          setChecked([]);
          updateFormData({groupIdIndex: groupIdIndex + 1});
        }
      });
    } else if (hasMoreGroups) {
      setChecked([]);
      updateFormData({groupIdIndex: groupIdIndex + 1});
    }
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText} variant="h6">
        Who should be added to the view {group.name}?
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1" style={{paddingBottom: '1rem'}}>
        A <Link href="https://documentation.uclusion.com/views" target="_blank">view</Link> controls the default
        addressing of notifications. Anyone not in a view must be manually mentioned or subscribed to a job to
        be notified.
      </Typography>
      <IdentityList participants={presences} setChecked={onAssignmentChange} checked={checked} />
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        onNext={next}
        onNextDoAdvance={!hasMoreGroups}
        nextLabel={hasMoreGroups ? 'nextGroup' : 'done'}
        spinOnClick={!_.isEmpty(checked)}
        finish={finish}
        showSkip={hasMoreGroups}
        onSkip={finish}
      />
    </WizardStepContainer>
  );
}

AssignViewsStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

AssignViewsStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};

export default AssignViewsStep;