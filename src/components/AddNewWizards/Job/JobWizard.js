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
import { getCommentThreads, getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../../constants/comments';
import ResolveCommentsStep from './ResolveCommentsStep'
import DecideWhereStep from './DecideWhereStep';
import { formCommentLink, navigate } from '../../../utils/marketIdPathFunctions';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import FindJobStep from './FindJobStep';
import JobApproverStep from './JobApproverStep';
import JobNameStep from './JobNameStep';
import { moveComments } from '../../../api/comments';
import { onCommentsMove } from '../../../utils/commentFunctions';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';

function JobWizard(props) {
  const { marketId, groupId, jobType } = props;
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
  const comments = marketId ? getMarketComments(commentsState, marketId, groupId) : [];
  const roots = (fromCommentIds || []).map((fromCommentId) =>
    comments.find((comment) => comment.id === fromCommentId));

  function onFinish(formData) {
    const { link } = formData;
    setOperationRunning(false);
    navigate(history, link);
  }

  function moveFromComments(inv, formData, updateFormData) {
    const { doResolveId, doTaskId } = formData;
    const { investible } = inv;
    const investibleId = investible.id;
    const movingComments = getCommentThreads(roots, comments);
    return moveComments(marketId, investibleId, fromCommentIds, doResolveId ? [doResolveId]: undefined,
      doTaskId ? [doTaskId] : undefined)
      .then((movedComments) => {
        setModifiedId(doResolveId || doTaskId);
        onCommentsMove(fromCommentIds, messagesState, movingComments, investibleId, commentsDispatch, marketId,
          movedComments, messagesDispatch);
        const link = formCommentLink(marketId, groupId, investibleId, fromCommentIds[0]);
        updateFormData({
          investibleId,
          link,
        });
        return {link};
      });
  }

  function getOpenQuestionSuggestionId() {
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
                           marketComments={comments} />
        )}
        {fromCommentId && (
          <FindJobStep marketId={marketId} groupId={groupId} roots={roots}
                       moveFromComments={fromCommentIds ? moveFromComments : undefined}/>
        )}
        <JobDescriptionStep onFinish={onFinish} marketId={marketId} groupId={groupId} roots={roots}
                            jobType={jobType} moveFromComments={fromCommentIds ? moveFromComments : undefined} />
        <JobNameStep onFinish={onFinish} marketId={marketId} groupId={groupId} jobType={jobType}
                     moveFromComments={fromCommentIds ? moveFromComments : undefined} />
        <JobAssignStep onFinish={onFinish} marketId={marketId} groupId={groupId} roots={roots}
                       moveFromComments={fromCommentIds ? moveFromComments : undefined} />
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

