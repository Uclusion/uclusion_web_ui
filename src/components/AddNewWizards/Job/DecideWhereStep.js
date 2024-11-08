import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import {
  addCommentToMarket, addMarketComments,
  getCommentThreads, getOpenInvestibleComments, moveToDiscussion
} from '../../../contexts/CommentsContext/commentsContextHelper';
import CondensedTodos from '../../../pages/Investible/Planning/CondensedTodos';
import _ from 'lodash';
import { ISSUE_TYPE, QUESTION_TYPE, REPLY_TYPE, SUGGEST_CHANGE_TYPE } from '../../../constants/comments';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { useHistory } from 'react-router';
import { alterComment } from '../../../api/comments';
import { formCommentLink, navigate } from '../../../utils/marketIdPathFunctions';
import { getMarketInfo } from '../../../utils/userFunctions';
import { changeInvestibleStageOnCommentClose } from '../../../utils/commentFunctions';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';

function DecideWhereStep (props) {
  const { marketId, fromCommentIds, marketComments, updateFormData, formData, isQuestion, useType } = props;
  const history = useHistory();
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [investibleState, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const classes = useContext(WizardStylesContext);
  const roots = (fromCommentIds || []).map((fromCommentId) =>
    marketComments.find((comment) => comment.id === fromCommentId) || {id: 'notFound'});
  const comments = getCommentThreads(roots, marketComments);
  const { useCompression } = formData;
  const isIssue = _.size(roots) === 1 && roots[0].comment_type === ISSUE_TYPE;

  function fixInvestibleStage(investibleId, updatedAt, commentId) {
    const investibleOpenComments = getOpenInvestibleComments(investibleId, marketComments);
    const otherAssistance = investibleOpenComments.find((comment) => comment.id !== commentId &&
      [SUGGEST_CHANGE_TYPE, QUESTION_TYPE, ISSUE_TYPE].includes(comment.comment_type));
    if (_.isEmpty(otherAssistance)) {
      const fromInv = getInvestible(investibleState, investibleId);
      const marketInfo = getMarketInfo(fromInv, marketId);
      changeInvestibleStageOnCommentClose([marketInfo], fromInv.investible, investiblesDispatch,
        updatedAt, marketStagesState);
    }
  }

  function moveToBug() {
    const comment = roots[0];
    const investibleId = comment.investible_id;
    const updatedAt = comment.updated_at;
    return alterComment(marketId, comment.id, 'RED')
      .then((response) => {
        addCommentToMarket(response, commentsState, commentsDispatch);
        const thread = marketComments.filter((aComment) => {
          return aComment.root_comment_id === comment.id;
        });
        const fixedThread = thread.map((aComment) => {
          return _.omit(aComment, 'investible_id');
        });
        addMarketComments(commentsDispatch, marketId, [...fixedThread]);
        fixInvestibleStage(investibleId, updatedAt, comment.id);
        setOperationRunning(false);
        navigate(history, formCommentLink(marketId, comment.group_id, undefined, comment.id));
      });
  }

  if (comments.find((comment) => comment.id === 'notFound')) {
    return React.Fragment;
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <Typography className={classes.introText}>
        Where do you want to move?
      </Typography>
      {useType && (
        <Typography className={classes.introSubText} variant="subtitle1">
          You are converting to a {useType}.
        </Typography>
      )}
      {_.size(roots) > 1 && (
        <CondensedTodos comments={roots} investibleComments={comments} isInbox marketId={marketId} hideTabs
                        isDefaultOpen />
      )}
      {_.size(roots) === 1 && (
        <>
          <CommentBox
            comments={comments}
            marketId={marketId}
            allowedTypes={[]}
            isInbox
            compressAll
            isMove
            removeActions
            displayRepliesAsTop={roots[0].comment_type === REPLY_TYPE}
            inboxMessageId={roots[0].id}
            toggleCompression={() => updateFormData({ useCompression: !useCompression })}
            useCompression={useCompression}
          />
          <div className={classes.borderBottom}/>
        </>
      )}
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        nextLabel="JobWizardNewJob"
        isFinal={false}
        spinOnClick={false}
        onNextSkipStep
        showOtherNext
        otherNextLabel="JobWizardExistingJob"
        otherSpinOnClick={false}
        showTerminate={isQuestion||isIssue}
        terminateLabel={isQuestion ? 'DiscussionMoveLabel' : 'BugMoveLabel'}
        terminateSpinOnClick
        onTerminate={isQuestion ? () => {
          const comment = roots[0];
          fixInvestibleStage(comment.investible_id, comment.updated_at, comment.id);
          moveToDiscussion(comment, commentsState, commentsDispatch, setOperationRunning, history);
        } : moveToBug}
      />
    </WizardStepContainer>
  );
}

DecideWhereStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecideWhereStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideWhereStep;