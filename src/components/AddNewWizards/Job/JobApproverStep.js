import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import _ from 'lodash';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import AssignmentList from '../../../pages/Dialog/Planning/AssignmentList';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { addPlanningInvestible, stageChangeInvestible, updateInvestible } from '../../../api/investibles';
import { formInvestibleLink } from '../../../utils/marketIdPathFunctions';
import { getInvestible, refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { getMarketInfo } from '../../../utils/userFunctions';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import JobDescription from '../../InboxWizards/JobDescription';
import {
  getFullStage,
  getInCurrentVotingStage,
  isFurtherWorkStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { useIntl } from 'react-intl';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { createJobNameFromComments } from '../../../pages/Dialog/Planning/userUtils';

function JobApproverStep(props) {
  const { marketId, updateFormData, formData, groupId, moveFromComments, roots, previousStep } = props;
  const [marketPresencesState, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [investibleState, investiblesDispatch] = useContext(InvestiblesContext);
  const classes = useContext(WizardStylesContext);
  const intl = useIntl();
  const { investibleId } = formData;
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const inv = getInvestible(investibleState, investibleId) || {};
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { required_approvers: approvers, stage: stageId, assigned } = marketInfo;
  const value = (formData.wasSet ? formData.approvers : approvers) || [];
  const validForm = !_.isEqual(value, approvers);
  const assignments = formData.assigned;
  const cannotBeAssigned = _.union(assignments || assigned,
    marketPresences?.find((presence) => presence.current_user));

  function onApproverChange(newApprovers){
    updateFormData({
      approvers: newApprovers,
      wasSet: true
    });
  }

  function createJob() {
    const name = createJobNameFromComments(roots, intl);
    // Coming from existing comments
    const addInfo = {
      name,
      groupId,
      marketId,
      assignments,
      requiredApprovers: value
    }
    return addPlanningInvestible(addInfo)
      .then((inv) => {
        setOperationRunning(false);
        refreshInvestibles(investiblesDispatch, () => {}, [inv]);
        const { id: investibleId } = inv.investible;
        let link = formInvestibleLink(marketId, investibleId);
        // update the form data with the saved investible
        updateFormData({
          investibleId,
          link,
        });
        if (moveFromComments) {
          return moveFromComments(inv, formData, updateFormData);
        }
      })
  }

  function assignJob() {
    const fullCurrentStage = getFullStage(marketStagesState, marketId, stageId) || {};
    if (isFurtherWorkStage(fullCurrentStage)) {
      // if assignments changing from none to some need to use stageChangeInvestible instead
      const fullMoveStage = getInCurrentVotingStage(marketStagesState, marketId);
      const moveInfo = {
        marketId,
        investibleId,
        stageInfo: {
          assignments,
          current_stage_id: stageId,
          stage_id: fullMoveStage.id,
          required_approvers: value
        },
      };
      return stageChangeInvestible(moveInfo)
        .then((newInv) => {
          setOperationRunning(false);
          onInvestibleStageChange(fullMoveStage.id, newInv, investibleId, marketId, commentsState,
            commentsDispatch, investiblesDispatch, () => {}, marketStagesState, undefined,
            fullCurrentStage, marketPresencesDispatch);
        });
    } else {
      const updateInfo = {
        marketId,
        investibleId,
        assignments,
        requiredApprovers: value,
      };
      return updateInvestible(updateInfo).then((fullInvestible) => {
        setOperationRunning(false);
        refreshInvestibles(investiblesDispatch, () => {}, [fullInvestible]);
      });
    }
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText} variant="h6">
        Who should be required to approve the job?
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        Required approvers will not be able to dismiss their notification to approve.
      </Typography>
      <JobDescription marketId={marketId} investibleId={investibleId}/>
      <div style={{ marginTop: '1rem' }}/>
      <AssignmentList
        fullMarketPresences={marketPresences}
        previouslyAssigned={approvers}
        onChange={onApproverChange}
        listHeader="requiredApprovers"
        cannotBeAssigned={cannotBeAssigned}
        groupId={groupId}
        marketId={marketId}
        showAllOnly
      />
      <div className={classes.borderBottom}/>
      <WizardStepButtons
        {...props}
        validForm={validForm}
        showNext={true}
        onNext={investibleId ? assignJob : createJob}
        showTerminate
        onTerminate={previousStep}
        terminateLabel="OnboardingWizardGoBack"

      />
    </WizardStepContainer>
  )
}

JobApproverStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
}

JobApproverStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
}

export default JobApproverStep