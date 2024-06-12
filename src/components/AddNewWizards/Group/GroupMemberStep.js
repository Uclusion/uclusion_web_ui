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
import { addGroupMembers } from '../../../contexts/GroupMembersContext/groupMembersContextReducer';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { getGroup } from '../../../contexts/MarketGroupsContext/marketGroupsContextHelper';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { usePresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';

function GroupMembersStep (props) {
  const { updateFormData, formData, marketId } = props
  const [, groupMembersDispatch] = useContext(GroupMembersContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [groupState] = useContext(MarketGroupsContext);
  const [marketsState] = useContext(MarketsContext);
  const presences = usePresences(marketId);
  const history = useHistory();
  const validForm = !_.isEmpty(formData.toAddClean);
  const classes = useContext(WizardStylesContext);
  const { groupId } = formData;
  const group = getGroup(groupState, marketId, groupId) || {};
  const market = getMarket(marketsState, marketId);

  function onNext() {
    const added = formData.toAddClean?.map((added) => {
      const found = presences.find((presence) => presence.external_id === added.external_id);
      return {user_id: found.id, is_following: true};
    });
    return changeGroupParticipation(market.id, group.id, added).then((newUsers) => {
      setOperationRunning(false);
      groupMembersDispatch(addGroupMembers(market.id, group.id, newUsers));
    });
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
          Who else needs to be in the group?
        </Typography>
        <AddNewUsers market={market} group={group} setToAddClean={(value) => updateFormData({ toAddClean: value })}/>
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