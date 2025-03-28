import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import {
  addCommentToMarket,
  getCommentRoot,
  getInvestibleComments,
  getMarketComments
} from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { getMarketInfo } from '../../../utils/userFunctions';
import { getStageNameForId } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { useHistory } from 'react-router';
import { formCommentLink, formMarketAddInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { resolveComment, updateComment } from '../../../api/comments';
import { QUESTION_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../../constants/comments';
import { getFormerStageId, handleAcceptSuggestion, isSingleAssisted } from '../../../utils/commentFunctions';
import { useIntl } from 'react-intl';
import JobDescription from '../JobDescription';
import { pokeComment } from '../../../api/users';
import Link from '@material-ui/core/Link';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { YELLOW_LEVEL } from '../../../constants/notifications';
import { getInboxTarget } from '../../../contexts/NotificationsContext/notificationsContextHelper';

function DecideAssistanceStep(props) {
  const { marketId, commentId, formData, updateFormData } = props;
  const intl = useIntl();
  const [commentState] = useContext(CommentsContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [investibleState, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const history = useHistory();
  const commentRoot = getCommentRoot(commentState, marketId, commentId) || {id: 'fake'};
  const marketComments = getMarketComments(commentState, marketId, commentRoot.group_id);
  const comments = marketComments.filter((comment) => comment.root_comment_id === commentRoot.id
    || comment.id === commentRoot.id);
  const investibleComments = commentRoot.investible_id ?
    getInvestibleComments(commentRoot.investible_id, marketId, commentState) : undefined;
  const classes = wizardStyles();
  const inv = getInvestible(investibleState, commentRoot.investible_id) || {};
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { former_stage_id: formerStageId, assigned } = marketInfo;
  const nextStageId = getFormerStageId(formerStageId, marketId, marketStagesState);
  const nextStageName = getStageNameForId(marketStagesState, marketId, nextStageId, intl);
  const isSingle = commentRoot.investible_id ? isSingleAssisted(investibleComments, assigned) : false;
  const isSuggest = commentRoot.comment_type === SUGGEST_CHANGE_TYPE;
  const { useCompression, parentElementId } = formData;

  function myOnFinish() {
    if (commentRoot.investible_id) {
      navigate(history, formCommentLink(marketId, commentRoot.group_id, commentRoot.investible_id, commentRoot.id));
    } else {
      // Never automatically navigate to archive
      navigate(history, getInboxTarget());
    }
  }

  function accept() {
    return updateComment({marketId, commentId, commentType: TODO_TYPE}).then((comment) => {
      handleAcceptSuggestion({ isMove: isSingle, comment, investible: inv, investiblesDispatch,
        marketStagesState, commentsState, commentsDispatch, messagesState, messagesDispatch })
      setOperationRunning(false);
      navigate(history, formCommentLink(marketId, comment.group_id, comment.investible_id, comment.id));
    });
  }

  function resolve() {
    return resolveComment(marketId, commentId)
      .then((comment) => {
        addCommentToMarket(comment, commentsState, commentsDispatch);
        setOperationRunning(false);
      });
  }

  function makeNormal() {
    return updateComment({marketId, commentId, notificationType: YELLOW_LEVEL}).then((comment) => {
      addCommentToMarket(comment, commentsState, commentsDispatch);
      setOperationRunning(false);
      navigate(history, formCommentLink(marketId, comment.group_id, comment.investible_id, comment.id));
    });
  }

  function doPokeComment() {
    return pokeComment(marketId, commentId).then(() => {
      setOperationRunning(false);
    });
  }
  const isQuestion = commentRoot.comment_type === QUESTION_TYPE;
  const isBug = !commentRoot.investible_id && !(isSuggest || isQuestion);

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        Done with
        {isQuestion ? ' question' : (isSuggest ? ' suggestion' : (commentRoot.investible_id ? ' blocking issue' :
          ' critical bug'))}?
      </Typography>
      {isSingle && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Resolving moves this job to {nextStageName}. Poke to resend notifications and
          message <Link href="https://documentation.uclusion.com/notifications" target="_blank">configured
          channels</Link>.
        </Typography>
      )}
      {isBug && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Moving this bug to normal removes it from triage but sends a one time notification. Poke to resend
          notifications and message <Link href="https://documentation.uclusion.com/notifications" target="_blank">configured
          channels</Link>.
        </Typography>
      )}
      {!isBug && !isSingle && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Poke to resend notifications and message <Link href="https://documentation.uclusion.com/notifications"
                                                         target="_blank">configured channels</Link>.
        </Typography>
      )}
      <JobDescription marketId={marketId} investibleId={commentRoot.investible_id} comments={comments}
                      removeActions
                      showVoting={!isBug}
                      inboxMessageId={commentId}
                      isSingleTaskDisplay={isBug}
                      useCompression={useCompression}
                      toggleCompression={() => updateFormData({ useCompression: !useCompression })}
                      showCreatedBy/>
      <div className={classes.borderBottom}/>
      {commentRoot.investible_id && (
        <WizardStepButtons
          {...props}
          focus
          finish={myOnFinish}
          nextLabel={isSuggest ? 'wizardAcceptLabel' : 'commentResolveLabel'}
          onNext={() => {
            if (isSuggest) {
              return accept();
            }
            resolve();
          }}
          showOtherNext={isSuggest}
          otherNextLabel="commentResolveLabel"
          onOtherNext={resolve}
          showTerminate
          terminateLabel="poke"
          terminateSpinOnClick
          onFinish={doPokeComment}
        />
      )}
      {!commentRoot.investible_id && (isSuggest || isQuestion) && (
        <WizardStepButtons
          {...props}
          finish={myOnFinish}
          nextLabel="BugWizardMoveToJob"
          spinOnClick={false}
          onNextDoAdvance={false}
          onNext={() => navigate(history,
            `${formMarketAddInvestibleLink(marketId, commentRoot.group_id, undefined,
              parentElementId)}&fromCommentId=${commentId}`)}
          showOtherNext
          otherNextLabel="commentResolveLabel"
          onOtherNext={resolve}
          showTerminate
          terminateLabel="poke"
          terminateSpinOnClick
          onFinish={doPokeComment}
        />
      )}
      {isBug && (
        <WizardStepButtons
          {...props}
          finish={myOnFinish}
          nextLabel="BugWizardMoveToJob"
          spinOnClick={false}
          onNextDoAdvance={false}
          onNext={() => navigate(history,
            `${formMarketAddInvestibleLink(marketId, commentRoot.group_id, undefined,
              parentElementId)}&fromCommentId=${commentId}`)}
          showOtherNext
          otherNextLabel="makeNormal"
          onOtherNext={makeNormal}
          showTerminate
          terminateLabel="poke"
          terminateSpinOnClick
          onFinish={doPokeComment}
        />
      )}
    </WizardStepContainer>
  );
}

DecideAssistanceStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecideAssistanceStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideAssistanceStep;