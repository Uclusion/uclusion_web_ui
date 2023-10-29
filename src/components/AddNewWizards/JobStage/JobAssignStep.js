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
import { stageChangeInvestible } from '../../../api/investibles';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { getFullStage, isAcceptedStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../../constants/comments';
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';

function JobAssignStep (props) {
  const { marketId, updateFormData, formData, investibleId, marketInfo, myFinish: finish, requiresAction } = props;
  const [marketPresencesState, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const classes = useContext(WizardStylesContext);
  const { assigned, stage: currentStageId, group_id: groupId } = marketInfo;
  const value = (formData.wasSet ? formData.assigned : assigned) || [];
  const myPresence = marketPresences.find((presence) => presence.current_user);
  const userId = myPresence?.id;
  const fullMoveStage = getFullStage(marketStagesState, marketId, formData.stage);
  const validForm = !_.isEqual(value, assigned)&&(!isAcceptedStage(fullMoveStage)|| value.includes(userId));
  const comments = getMarketComments(commentsState, marketId, groupId);
  const unresolvedComments = comments.filter(comment => comment.investible_id === investibleId && !comment.resolved);

  function onAssignmentChange(newAssignments){
    updateFormData({
      assigned: newAssignments,
      wasSet: true
    });
  }

  function isRequiresInput() {
    return !_.isEmpty((unresolvedComments || []).find((fromComment) => {
      return (formData.wasSet && value.includes(fromComment.created_by)
        && (fromComment.comment_type === QUESTION_TYPE || fromComment.comment_type === SUGGEST_CHANGE_TYPE));
    }));
  }

  function isBlocked() {
    return !_.isEmpty((unresolvedComments || []).find((fromComment) => {
      return fromComment.comment_type === ISSUE_TYPE;
    }));
  }

  const isCloseComments = (isRequiresInput() || isBlocked()) && !fullMoveStage.close_comments_on_entrance;
  function assignJob() {
    if (isCloseComments) {
      // No op go to CloseCommentsStep
      setOperationRunning(false);
      return Promise.resolve(true);
    }

    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        assignments: value,
        current_stage_id: marketInfo.stage,
        stage_id: fullMoveStage.id,
      },
    };
    const fullCurrentStage = getFullStage(marketStagesState, marketId, currentStageId);
    return stageChangeInvestible(moveInfo)
      .then((newInv) => {
        onInvestibleStageChange(fullMoveStage.id, newInv, investibleId, marketId, commentsState,
          commentsDispatch, investiblesDispatch, () => {}, marketStagesState, undefined,
          fullCurrentStage, marketPresencesDispatch);
        setOperationRunning(false);
        finish(fullMoveStage);
      });
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
        <Typography className={classes.introText} variant="h6">
          Who should be working on the job?
        </Typography>
        <Typography className={classes.introSubText} variant="subtitle1">
          {isAcceptedStage(fullMoveStage) ? 'This job must be assigned for you to move to Accepted.' :
            'This job must be assigned to move out of backlog.'}
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
          showNext
          isFinal={!requiresAction(fullMoveStage)}
          showTerminate
          onNext={assignJob}
          skipNextStep={!isCloseComments}
          onTerminate={() => finish(fullMoveStage, true)}
          terminateLabel="JobWizardBacktoJob"
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