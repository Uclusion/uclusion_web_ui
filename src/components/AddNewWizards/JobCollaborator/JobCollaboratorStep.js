import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import _ from 'lodash';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import AssignmentList from '../../../pages/Dialog/Planning/AssignmentList';
import {
  getGroupPresences,
  getMarketPresences,
  partialUpdateInvestment
} from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { addressInvestible } from '../../../api/investibles';
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { getMarketInfo } from '../../../utils/userFunctions';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';
import JobDescription from '../../InboxWizards/JobDescription';
import { useAddressed } from '../../../utils/votingUtils';

function JobCollaboratorStep (props) {
  const { marketId, updateFormData, formData, onFinish, investibleId } = props;
  const history = useHistory();
  const [marketPresencesState, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const [investibleState] = useContext(InvestiblesContext);
  const classes = useContext(WizardStylesContext);
  const inv = getInvestible(investibleState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { assigned, group_id: groupId } = marketInfo;
  const groupPresences = getGroupPresences(marketPresences, groupPresencesState, marketId, groupId) || [];
  const addressed = useAddressed(groupPresences, marketPresences, investibleId, marketId);
  const addressedIds = (addressed || []).filter((address) => !address.abstain)
    .map((address) => address.id);
  const value = (formData.wasSet ? formData.addressed : addressedIds) || [];
  const validForm = !_.isEqual(value, addressedIds);
  const cannotBeAssigned = _.union(assigned, groupPresences.map((presence) => presence.id));

  function onAddressedChange(newAddressed){
    updateFormData({
      addressed: newAddressed,
      wasSet: true
    });
  }

  function finish() {
    navigate(history, formInvestibleLink(marketId, investibleId));
  }

  function addressJob() {
    const following = value.map((userId) => { return {user_id: userId, is_following: true}; });
    const notFollowingNow = addressedIds.filter((userId) => !value.includes(userId))
      .map((userId) => { return {user_id: userId, is_following: false}; });
    const newAddressed = _.union(following, notFollowingNow);
    return addressInvestible(marketId, investibleId, newAddressed).then((partialUserList) => {
      partialUserList.forEach((partialUser) => {
        const investmentResult = { ...partialUser, investible_id: investibleId, market_id: marketId }
        partialUpdateInvestment(marketPresencesDispatch, investmentResult, false);
      });
      setOperationRunning(false);
      finish();
    });
  }

  return (
    <WizardStepContainer
      {...props}
    >
        <Typography className={classes.introText} variant="h6">
          Who outside the group should be collaborating on the job?
        </Typography>
        <JobDescription marketId={marketId} investibleId={investibleId} />
        <AssignmentList
          fullMarketPresences={marketPresences}
          previouslyAssigned={addressedIds}
          cannotBeAssigned={cannotBeAssigned}
          onChange={onAddressedChange}
          groupId={groupId}
          marketId={marketId}
          showAllOnly
          listHeader="collaborators"
        />

        <div className={classes.borderBottom}/>
        <WizardStepButtons
          {...props}
          finish={onFinish}
          validForm={validForm}
          showNext={true}
          onNext={addressJob}
        />
    </WizardStepContainer>
  )
}

JobCollaboratorStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
}

JobCollaboratorStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
}

export default JobCollaboratorStep