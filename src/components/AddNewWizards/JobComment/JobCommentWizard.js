import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import AddCommentStep from './AddCommentStep';
import { QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../../constants/comments';
import AddOptionStep from './AddOptionStep';
import ConfigureCommentStep from '../ConfigureCommentStep';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import CommentEdit from '../../Comments/CommentEdit';
import { getPageReducerPage, usePageStateReducer } from '../../PageState/pageStateHooks';
import { usePresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';

function JobCommentWizard(props) {
  const { investibleId, marketId, commentType } = props;
  const [commentsState] = useContext(CommentsContext);
  const presences = usePresences(marketId);
  const isQuestion = commentType === QUESTION_TYPE;
  const investibleComments = (commentsState[marketId]||[]).filter(comment =>
    comment.investible_id === investibleId) || [];
  const myPresence = presences.find((presence) => presence.current_user) || {};
  const savedQuestion = investibleComments.find((comment) => {
    return comment.comment_type === QUESTION_TYPE && !comment.resolved && !comment.deleted && !comment.is_sent
      && comment.created_by === myPresence?.id;
  });
  const hasDraft = isQuestion && savedQuestion;
  const draftData = {inlineMarketId: savedQuestion?.inline_market_id, commentId: savedQuestion?.id, groupId:
    savedQuestion?.group_id, marketId, investibleId };
  const [editStateFull, editDispatch] = usePageStateReducer('commentEdit');
  const [editState, updateEditState, editStateReset] = getPageReducerPage(editStateFull, editDispatch, savedQuestion?.id);

  return (
    <WizardStylesProvider>
      <FormdataWizard name={`job_comment_wizard${investibleId}`} useLocalStorage={false}
                      defaultFormData={hasDraft ? draftData : undefined}>
        {!hasDraft && (
          <AddCommentStep investibleId={investibleId} marketId={marketId} useType={commentType} />
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
        {isQuestion && (
          <AddOptionStep investibleId={investibleId} marketId={marketId} />
        )}
        {[QUESTION_TYPE, SUGGEST_CHANGE_TYPE].includes(commentType) && (
          <ConfigureCommentStep useType={commentType} />
        )}
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

JobCommentWizard.propTypes = {
  investibleId: PropTypes.string.isRequired
};
export default JobCommentWizard;

