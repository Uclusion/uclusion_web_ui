import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import JobDescriptionStep from './JobDescriptionStep'
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import JobAssignStep from './JobAssignStep'
import JobApproveStep from './JobApproveStep';
import { useHistory, useLocation } from 'react-router';
import queryString from 'query-string'
import _ from 'lodash'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import {
  addCommentToMarket,
  getComment,
  getCommentThreads,
  getMarketComments
} from '../../../contexts/CommentsContext/commentsContextHelper';
import { ISSUE_TYPE, QUESTION_TYPE, REPLY_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../../constants/comments';
import ResolveCommentsStep from './ResolveCommentsStep'
import DecideWhereStep from './DecideWhereStep';
import { formCommentLink, navigate } from '../../../utils/marketIdPathFunctions';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import FindJobStep from './FindJobStep';
import JobApproverStep from './JobApproverStep';
import JobNameStep from './JobNameStep';
import { moveComments } from '../../../api/comments';
import {
  changeInvestibleStageOnCommentClose,
  changeInvestibleStageOnCommentOpen,
  onCommentsMove
} from '../../../utils/commentFunctions';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import {
  getMarketPresences,
  useGroupPresences
} from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';

function JobWizard(props) {
  const { marketId, groupId, jobType, useType } = props;
  const [modifiedId, setModifiedId] = useState(undefined);
  const location = useLocation();
  const history = useHistory();
  const { hash } = location;
  const values = queryString.parse(hash || '') || {};
  const { fromCommentId } = values;
  const fromCommentIds = _.isArray(fromCommentId) ? fromCommentId : (fromCommentId ? [fromCommentId] :
    undefined);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [investiblesState, investibleDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const presences = getMarketPresences(marketPresencesState, marketId) || [];
  const isSingleUser = useGroupPresences(groupId, marketId, presences);
  const myPresence = presences.find((presence) => presence.current_user);
  const comments = marketId ? getMarketComments(commentsState, marketId, groupId) : [];
  const roots = (fromCommentIds || []).map((fromCommentId) =>
    comments.find((comment) => comment.id === fromCommentId));
  const isReplyConvert = roots.length > 0 && roots[0].comment_type === REPLY_TYPE;
  const isConvert = isReplyConvert || (roots.length > 0 && ((roots[0].comment_type === TODO_TYPE &&
    useType === 'Suggestion')||(roots[0].comment_type === SUGGEST_CHANGE_TYPE && useType === 'Task')));
  const isAssistanceMove = roots.length > 0 &&
    [SUGGEST_CHANGE_TYPE, QUESTION_TYPE, ISSUE_TYPE].includes(roots[0].comment_type);

  function onFinish(formData) {
    const { link } = formData;
    setOperationRunning(false);
    navigate(history, link);
  }

  function moveFromComments(inv, formData, updateFormData, isExistingToInv=false) {
    const { doResolveId, doTaskId } = formData;
    let myDoTaskId = doTaskId;
    let replyId;
    if (isConvert) {
      myDoTaskId = roots[0].id;
      replyId = roots[0].reply_id;
    }
    const isSuggestion = useType === 'Suggestion';
    const { investible } = inv;
    const investibleId = investible.id;
    const movingComments = getCommentThreads(roots, comments);
    const fromInv = isAssistanceMove && roots[0].investible_id ?
      getInvestible(investiblesState, roots[0].investible_id) : undefined;
    return moveComments(marketId, investibleId, fromCommentIds, doResolveId ? [doResolveId]: undefined,
      myDoTaskId && !isSuggestion ? [myDoTaskId] : undefined,
      isSuggestion && myDoTaskId ? [myDoTaskId] : undefined)
      .then((movedComments) => {
        if (!isConvert) {
          setModifiedId(doResolveId || myDoTaskId);
        }
        if (isAssistanceMove) {
          if (fromInv) {
            const marketInfo = getMarketInfo(fromInv, marketId);
            changeInvestibleStageOnCommentClose([marketInfo], fromInv.investible, investibleDispatch,
              movedComments[0].updated_at, marketStagesState);
          }
          if (isExistingToInv) {
            const investibleBlocks = roots[0].comment_type === ISSUE_TYPE;
            changeInvestibleStageOnCommentOpen(investibleBlocks, !investibleBlocks, marketStagesState,
              inv.market_infos, inv.investible, investibleDispatch, movedComments[0], myPresence);
          }
        }
        onCommentsMove(fromCommentIds, messagesState, movingComments, investibleId, commentsDispatch, marketId,
          movedComments, messagesDispatch);
        if (replyId) {
          const parentComment = getComment(commentsState, marketId, replyId);
          if (parentComment.children) {
            parentComment.children = parentComment.children.filter((id) => id !== myDoTaskId);
            addCommentToMarket(parentComment, commentsState, commentsDispatch);
          }
        }
        const link = formCommentLink(marketId, groupId, investibleId, fromCommentIds[0]);
        updateFormData({
          investibleId,
          link,
        });
        return {link};
      });
  }

  function getOpenQuestionSuggestionId() {
    if (isConvert) {
      // They are already converting something - don't ask again
      return undefined;
    }
    // For now only supporting one since no UI to get more than one
    if (modifiedId) {
      return modifiedId;
    }
    let aRequireInputId = undefined;
    (fromCommentIds || []).forEach((fromCommentId) => {
      const fromComment = comments.find((comment) => comment.id === fromCommentId);
      if (fromComment && !fromComment.resolved &&
        [QUESTION_TYPE, SUGGEST_CHANGE_TYPE].includes(fromComment.comment_type)) {
        aRequireInputId = fromComment.id;
      }
    });
    return aRequireInputId;
  }

  const requiresInputId = getOpenQuestionSuggestionId();
  if (!_.isEmpty(fromCommentIds) && _.size(roots) !== _.size(fromCommentIds)) {
    return React.Fragment;
  }

  return (
    <WizardStylesProvider>
      <FormdataWizard name={`job_wizard${_.isArray(fromCommentId) ? groupId : fromCommentId}`}
                      defaultFormData={{useCompression: true}} useLocalStorage={false}>
        {requiresInputId && (
          <ResolveCommentsStep marketId={marketId} commentId={requiresInputId} marketComments={comments} />
        )}
        {fromCommentId && (
          <DecideWhereStep fromCommentIds={fromCommentIds} marketId={marketId} groupId={groupId}
                           useType={isConvert ? useType : undefined}
                           marketComments={comments} isDiscussion={!_.isEmpty(requiresInputId)} />
        )}
        {fromCommentId && (
          <FindJobStep marketId={marketId} groupId={groupId} roots={roots} isConvert={isConvert}
                       useType={isConvert ? useType : undefined}
                       moveFromComments={fromCommentIds ? moveFromComments : undefined}/>
        )}
        <JobDescriptionStep onFinish={onFinish} marketId={marketId} groupId={groupId} roots={roots} presences={presences}
                            isSingleUser={isSingleUser} jobType={jobType} myPresenceId={myPresence?.id}
                            moveFromComments={fromCommentIds ? moveFromComments : undefined} />
        <JobNameStep onFinish={onFinish} marketId={marketId} groupId={groupId} jobType={jobType}
                     myPresenceId={myPresence?.id} isSingleUser={isSingleUser}
                     moveFromComments={fromCommentIds ? moveFromComments : undefined} />
        {!isSingleUser && (
          <JobAssignStep onFinish={onFinish} marketId={marketId} groupId={groupId} roots={roots}
                         moveFromComments={fromCommentIds ? moveFromComments : undefined} />
        )}
        <JobApproverStep marketId={marketId} groupId={groupId} roots={roots}
                         moveFromComments={fromCommentIds ? moveFromComments : undefined} />
        <JobApproveStep onFinish={onFinish} marketId={marketId} groupId={groupId} />
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

JobWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

JobWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default JobWizard;

