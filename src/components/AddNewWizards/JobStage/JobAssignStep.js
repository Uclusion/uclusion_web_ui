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
import { stageChangeInvestible, updateInvestible } from '../../../api/investibles';
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { findMessagesForInvestibleId } from '../../../utils/messageUtils';
import { removeMessages } from '../../../contexts/NotificationsContext/notificationsContextReducer';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import {
  getFullStage,
  getInCurrentVotingStage,
  getNotDoingStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../../constants/comments';
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';

function JobAssignStep (props) {
  const { marketId, updateFormData, formData, investibleId, marketInfo, startOver } = props;
  const history = useHistory();
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const classes = useContext(WizardStylesContext);
  const { assigned } = marketInfo;
  const value = (formData.wasSet ? formData.assigned : assigned) || [];
  const validForm = !_.isEqual(value, assigned);
  const comments = getMarketComments(commentsState, marketId);
  const unresolvedComments = comments.filter(comment => comment.investible_id === investibleId &&
    !comment.resolved);
  const newStageId = formData.stage;

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
    const updateInfo = {
      marketId,
      investibleId,
      assignments: value,
    };
    return updateInvestible(updateInfo).then((fullInvestible) => {
      const returnedMarketInfo = getMarketInfo(fullInvestible, marketId);
      // quick add that now in ready for approval
      returnedMarketInfo.stage = getInCurrentVotingStage(marketStagesState, marketId).id;
      refreshInvestibles(investiblesDispatch, () => {}, [fullInvestible]);
      const messages = findMessagesForInvestibleId(investibleId, messagesState) || [];
      const messageIds = messages.map((message) => message.type_object_id);
      messagesDispatch(removeMessages(messageIds));
    });
  }

  function moveToNotDoing() {
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: marketInfo.stage,
        stage_id: getNotDoingStage(marketStagesState, marketId).id
      },
    };
    return stageChangeInvestible(moveInfo)
      .then((newInv) => {
        onInvestibleStageChange(newStageId, newInv, investibleId, marketId, commentsState,
          commentsDispatch, investiblesDispatch, () => {}, marketStagesState, undefined,
          getFullStage(marketStagesState, marketId, marketInfo.stage));
        const messages = findMessagesForInvestibleId(investibleId, messagesState) || [];
        const messageIds = messages.map((message) => message.type_object_id);
        messagesDispatch(removeMessages(messageIds));
        setOperationRunning(false);
        finish();
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

  return (
    <WizardStepContainer
      {...props}
    >
      <div>
        <Typography className={classes.introText} variant="h6">
          Who should be working on the job?
        </Typography>
        <Typography className={classes.introSubText} variant="subtitle1">
          Unless you are moving to Not Doing this job must be assigned first.
        </Typography>
        <AssignmentList
          fullMarketPresences={marketPresences}
          previouslyAssigned={assigned}
          requiresInput={isRequiresInput()}
          onChange={onAssignmentChange}
        />
        <div className={classes.borderBottom}/>
        <WizardStepButtons
          {...props}
          validForm={validForm}
          showNext={true}
          showTerminate={true}
          showOtherNext={true}
          otherNextLabel="JobAssignNotDoing"
          onNext={assignJob}
          onOtherNext={moveToNotDoing}
          onTerminate={finish}
          onIncrement={startOver}
          terminateLabel="JobWizardGotoJob"
        />
      </div>
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