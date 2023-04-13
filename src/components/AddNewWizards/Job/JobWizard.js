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
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper'
import { QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../../constants/comments'
import ResolveCommentsStep from './ResolveCommentsStep'
import DecideWhereStep from './DecideWhereStep';
import { navigate } from '../../../utils/marketIdPathFunctions';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';

function JobWizard(props) {
  const { marketId, groupId, assigneeId } = props;
  const [resolvedId, setResolvedId] = useState(undefined);
  const location = useLocation();
  const history = useHistory();
  const { hash } = location;
  const values = queryString.parse(hash || '') || {};
  const { fromCommentId } = values;
  const fromCommentIds = _.isArray(fromCommentId) ? fromCommentId : (fromCommentId ? [fromCommentId] : undefined);
  const [commentsState] = useContext(CommentsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const comments = marketId ? getMarketComments(commentsState, marketId, groupId) : [];

  function onFinish(formData) {
    const { link } = formData;
    setOperationRunning(false);
    navigate(history, link);
  }

  function getOpenQuestionSuggestionId() {
    // For now only supporting one since no UI to get more than one
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

  if (!_.isEmpty(fromCommentIds) && _.isEmpty(comments)) {
    return React.Fragment;
  }

  return (
    <WizardStylesProvider>
      <FormdataWizard name="job_wizard" useLocalStorage={false}>
        {(requiresInputId || (fromCommentId && resolvedId === fromCommentId)) && (
          <ResolveCommentsStep marketId={marketId} commentId={requiresInputId} marketComments={comments}
                               setResolvedId={setResolvedId} />
        )}
        {fromCommentId && (
          <DecideWhereStep fromCommentIds={fromCommentIds} marketId={marketId} groupId={groupId}
                           marketComments={comments} />
        )}
        <JobDescriptionStep onFinish={onFinish} marketId={marketId} groupId={groupId} fromCommentIds={fromCommentIds}
                            marketComments={comments}/>
        <JobAssignStep onFinish={onFinish} marketId={marketId} assigneeId={assigneeId} />
        <JobApproveStep onFinish={onFinish} marketId={marketId} groupId={groupId}/>
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

