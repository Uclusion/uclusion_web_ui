import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import AddOptionStep from './AddOptionStep';
import AddCommentStep from './AddCommentStep';
import ConfigureCommentStep from '../ConfigureCommentStep';
import { QUESTION_TYPE } from '../../../constants/comments';
import { getPageReducerPage, usePageStateReducer } from '../../PageState/pageStateHooks';
import { usePresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import CommentEdit from '../../Comments/CommentEdit';

function DiscussionWizard(props) {
  const { marketId, groupId, commentType } = props;
  const [commentsState] = useContext(CommentsContext);
  const presences = usePresences(marketId);
  const isQuestion = commentType === QUESTION_TYPE;
  const myPresence = presences.find((presence) => presence.current_user) || {};
  const savedQuestion = (commentsState[marketId]||[]).find((comment) => {
    return comment.comment_type === QUESTION_TYPE && !comment.resolved && !comment.deleted && !comment.is_sent
      && comment.created_by === myPresence?.id;
  });
  const hasDraft = isQuestion && savedQuestion;
  const draftData = {inlineMarketId: savedQuestion?.inline_market_id, commentId: savedQuestion?.id, groupId:
    savedQuestion?.group_id, marketId };
  const [editStateFull, editDispatch] = usePageStateReducer('commentEdit');
  const [editState, updateEditState, editStateReset] = getPageReducerPage(editStateFull, editDispatch,
    savedQuestion?.id);

  return (
    <WizardStylesProvider>
      <FormdataWizard name="discussion_wizard" defaultFormData={hasDraft ? draftData : undefined}>
        {!hasDraft && (
          <AddCommentStep marketId={marketId} groupId={groupId} useType={commentType}  />
        )}
        {hasDraft && (
          <CommentEdit
            marketId={marketId}
            comment={savedQuestion}
            editState={editState}
            updateEditState={updateEditState}
            editStateReset={editStateReset}
            isWizard
          />
        )}
        <AddOptionStep />
        <ConfigureCommentStep useType={commentType} />
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

DiscussionWizard.propTypes = {
  marketId: PropTypes.string.isRequired,
  groupId: PropTypes.string.isRequired,
  commentType: PropTypes.string.isRequired
};
export default DiscussionWizard;

