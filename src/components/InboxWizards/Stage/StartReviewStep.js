import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import { formCommentLink, navigate } from '../../../utils/marketIdPathFunctions';
import { REPORT_TYPE } from '../../../constants/comments';
import { stageChangeInvestible } from '../../../api/investibles';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { useHistory } from 'react-router';
import { getInReviewStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import CommentAdd from '../../Comments/CommentAdd';
import { getPageReducerPage, usePageStateReducer } from '../../PageState/pageStateHooks';

function StartReviewStep(props) {
  const { marketId, investibleId, inv, groupId, currentStageId } = props;
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, invDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [commentAddStateFull, commentAddDispatch] = usePageStateReducer('commentAddStartReview');
  const [commentAddState, updateCommentAddState, commentAddStateReset] =
    getPageReducerPage(commentAddStateFull, commentAddDispatch, investibleId || marketId);
  const classes = wizardStyles();
  const history = useHistory();
  const { investible: myInvestible } = inv || {};
  const destinationStage = getInReviewStage(marketStagesState, marketId) || {};

  function onSave(comment) {
    const link = formCommentLink(marketId, groupId, investibleId, comment.id);
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: currentStageId,
        stage_id: destinationStage.id,
      },
    };
    setOperationRunning(true);
    return stageChangeInvestible(moveInfo).then((newInv) => {
      onInvestibleStageChange(destinationStage.id, newInv, investibleId, marketId, commentsState, commentsDispatch,
        invDispatch, () => {}, marketStagesState, undefined, destinationStage);
      setOperationRunning(false);
      navigate(history, link);
    });
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText} style={{marginBottom: 'unset'}}>
        What do you want reviewed?
      </Typography>
      <CommentAdd
        nameKey="CommentAddStartReview"
        type={REPORT_TYPE}
        wizardProps={props}
        commentAddState={commentAddState}
        updateCommentAddState={updateCommentAddState}
        commentAddStateReset={commentAddStateReset}
        issueWarningId='issueWarningPlanning'
        marketId={marketId}
        groupId={groupId}
        investible={myInvestible}
        onSave={onSave}
        nameDifferentiator="startReview"
        isStory
      />
    </div>
    </WizardStepContainer>
  );
}

StartReviewStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

StartReviewStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default StartReviewStep;