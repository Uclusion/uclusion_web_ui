import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import {
  getCommentThreads,
  getMarketComments,
  refreshMarketComments
} from '../../../contexts/CommentsContext/commentsContextHelper';
import { QUESTION_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../../constants/comments';
import _ from 'lodash';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { getFullStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { stageChangeInvestible } from '../../../api/investibles';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';

function CloseCommentsStep(props) {
  const { marketId, investibleId, formData, marketInfo } = props;
  const history = useHistory();
  const classes = useContext(WizardStylesContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const marketComments = getMarketComments(commentsState, marketId);
  const unresolvedComments = marketComments.filter(comment => comment.investible_id === investibleId &&
    !comment.resolved);
  const { hasOpenTodos, stage } = formData;
  const { assigned } = marketInfo;
  const mustResolveComments = hasOpenTodos ?
    unresolvedComments.filter((comment) => comment.comment_type === TODO_TYPE) :
    unresolvedComments.filter((comment) => [QUESTION_TYPE, SUGGEST_CHANGE_TYPE].includes(comment.comment_type) &&
      (assigned || []).includes(comment.created_by));
  const commentThreads = getCommentThreads(mustResolveComments, marketComments);

  function finish() {
    navigate(history, formInvestibleLink(marketId, investibleId));
  }

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
    return stageChangeInvestible(moveInfo)
      .then((response) => {
        const { full_investible: newInv, comments } = response;
        refreshMarketComments(commentsDispatch, marketId, comments);
        onInvestibleStageChange(stage, newInv, investibleId, marketId, undefined,
          undefined, investiblesDispatch, () => {}, marketStagesState, undefined,
          getFullStage(marketStagesState, marketId, stage));
        setOperationRunning(false);
        finish();
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
        {hasOpenTodos ? 'Will you resolve open tasks?' : 'Does the job still need assistance?'}
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        {hasOpenTodos ? 'Cannot move a job to Verified which has open tasks. '
          : 'Jobs do not move while an assignee has a question or suggestion. '} Hit next to resolve and move.
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