import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import _ from 'lodash'
import WizardStepContainer from '../WizardStepContainer'
import { WizardStylesContext } from '../WizardStylesContext'
import WizardStepButtons from '../WizardStepButtons'
import AssignmentList from '../../../pages/Dialog/Planning/AssignmentList'
import {
  getMarketPresences,
  removeInvestibleInvestments
} from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { stageChangeInvestible, updateInvestible } from '../../../api/investibles';
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router'
import { refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { useInvestibleVoters } from '../../../utils/votingUtils';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { findMessagesForInvestibleId } from '../../../utils/messageUtils';
import { removeMessages } from '../../../contexts/NotificationsContext/notificationsContextReducer';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { getFullStage, getFurtherWorkStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../../constants/comments';
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import JobDescription from '../../InboxWizards/JobDescription';

function JobAssignStep (props) {
  const { marketId, updateFormData, formData, onFinish, investibleId, marketInfo } = props;
  const history = useHistory();
  const [marketPresencesState, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const classes = useContext(WizardStylesContext);
  const { assigned, group_id: groupId } = marketInfo;
  const value = (formData.wasSet ? formData.assigned : assigned) || [];
  const validForm = !_.isEqual(value, assigned || []);
  const voters = useInvestibleVoters(marketPresences, investibleId, marketId);
  const comments = getMarketComments(commentsState, marketId, groupId);
  const unresolvedComments = comments.filter(comment => comment.investible_id === investibleId &&
    !comment.resolved);

  function onAssignmentChange(newAssignments){
    updateFormData({
      assigned: newAssignments,
      wasSet: true
    });
  }

  function finish() {
    navigate(history, formInvestibleLink(marketId, investibleId));
  }

  function assignJob() {
    if (_.isEmpty(value)) {
      const furtherWorkStage = getFurtherWorkStage(marketStagesState, marketId);
      const moveInfo = {
        marketId,
        investibleId,
        stageInfo: {
          current_stage_id: marketInfo.stage,
          stage_id: furtherWorkStage.id,
        },
      };
      return stageChangeInvestible(moveInfo)
        .then((newInv) => {
          onInvestibleStageChange(furtherWorkStage.id, newInv, investibleId, marketId, commentsState,
            commentsDispatch, investiblesDispatch, () => {}, marketStagesState, undefined,
            getFullStage(marketStagesState, marketId, marketInfo.stage));
          setOperationRunning(false);
          finish();
        });
    }
    const updateInfo = {
      marketId,
      investibleId,
      assignments: value,
    };
    return updateInvestible(updateInfo).then((fullInvestible) => {
      refreshInvestibles(investiblesDispatch, () => {}, [fullInvestible]);
      const messages = findMessagesForInvestibleId(investibleId, messagesState) || [];
      const messageIds = messages.map((message) => message.type_object_id);
      messagesDispatch(removeMessages(messageIds));
      removeInvestibleInvestments(marketPresencesState, marketPresencesDispatch, marketId, investibleId);
      setOperationRunning(false);
    });
  }

  function isRequiresInput() {
    let isInputRequired = false;
    (unresolvedComments || []).forEach((fromComment) => {
      if (formData.wasSet && value.includes(fromComment.created_by)
        && (fromComment.comment_type === QUESTION_TYPE || fromComment.comment_type === SUGGEST_CHANGE_TYPE)) {
        isInputRequired = true;
      }
    });
    return isInputRequired;
  }
  const reassigningWarning = _.isEmpty(voters) ? '' :
    'Reassigning removes all approvals and moves the job to Ready for Approval.';
  const unassignedWarning = _.isEmpty(assigned) ? '' : 'An unassigned job will be sent to the job backlog.';

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
        <Typography className={classes.introText} variant="h6">
          Who should be working on the job?
        </Typography>
        <Typography className={classes.introSubText} variant="subtitle1">
          {unassignedWarning} {reassigningWarning}
        </Typography>
        <JobDescription marketId={marketId} investibleId={investibleId} showDescription={false} showAssigned={false} />
        <AssignmentList
          fullMarketPresences={marketPresences}
          previouslyAssigned={assigned}
          requiresInput={isRequiresInput()}
          onChange={onAssignmentChange}
        />

        <div className={classes.borderBottom}/>
        <WizardStepButtons
          {...props}
          finish={onFinish}
          validForm={validForm}
          showNext={true}
          nextLabel="createAssignment"
          onNext={assignJob}
          isFinal={_.isEmpty(value)}
          onNextDoAdvance={!_.isEmpty(value)}
        />
    </WizardStepContainer>
  )
}

JobAssignStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
}

JobAssignStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
}

export default JobAssignStep