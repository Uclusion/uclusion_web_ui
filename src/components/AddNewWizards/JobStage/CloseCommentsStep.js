import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import {
  addMarketComments,
  getCommentThreads,
  getMarketComments
} from '../../../contexts/CommentsContext/commentsContextHelper';
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../../constants/comments';
import _ from 'lodash';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { getFullStage, isVerifiedStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { stageChangeInvestible } from '../../../api/investibles';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';

function CloseCommentsStep(props) {
  const { marketId, investibleId, formData, marketInfo, myFinish: finish } = props;
  const classes = useContext(WizardStylesContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const { assigned, group_id: groupId } = marketInfo;
  const marketComments = getMarketComments(commentsState, marketId, groupId);
  const unresolvedComments = marketComments.filter(comment => comment.investible_id === investibleId &&
    !comment.resolved);
  const { stage } = formData;
  const fullMoveStage = getFullStage(marketStagesState, marketId, stage);
  const mustResolveComments = unresolvedComments.filter((comment) =>
    (comment.comment_type === ISSUE_TYPE)||
    (!isVerifiedStage(fullMoveStage) && comment.comment_type === TODO_TYPE)||
      ([QUESTION_TYPE, SUGGEST_CHANGE_TYPE].includes(comment.comment_type) &&
      (assigned || []).includes(comment.created_by)));
  const commentThreads = getCommentThreads(mustResolveComments, marketComments);

  function move() {
    // Do not rely on async to close the comments cause want this user to be updated by and not auto opened if return
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: marketInfo.stage,
        stage_id: stage,
        resolve_comment_ids: mustResolveComments.map((comment) => comment.id)
      },
    };
    if (!_.isEmpty(formData.assigned)) {
      moveInfo.assignments = formData.assigned;
    }
    return stageChangeInvestible(moveInfo)
      .then((response) => {
        const { full_investible: newInv, comments } = response;
        addMarketComments(commentsDispatch, marketId, comments);
        onInvestibleStageChange(stage, newInv, investibleId, marketId, undefined,
          undefined, investiblesDispatch, () => {}, marketStagesState, undefined,
          getFullStage(marketStagesState, marketId, marketInfo.stage));
        setOperationRunning(false);
        finish(fullMoveStage);
      });
  }

  if (_.isEmpty(mustResolveComments)) {
    return React.Fragment;
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        Will you resolve these comments?
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        Sometimes questions, suggestions, issues or tasks must be resolved to move to a stage.
      </Typography>
      <div className={classes.wizardCommentBoxDiv}>
        <CommentBox
          comments={commentThreads}
          marketId={marketId}
          allowedTypes={[]}
          isInbox
          removeActions
        />
      </div>
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        showNext={true}
        showTerminate={true}
        onNext={move}
        onTerminate={finish}
        terminateLabel="JobWizardGotoJob"
      />
    </div>
    </WizardStepContainer>
  );
}

CloseCommentsStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

CloseCommentsStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default CloseCommentsStep;