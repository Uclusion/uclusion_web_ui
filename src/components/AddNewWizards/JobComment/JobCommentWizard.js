import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import AddCommentStep from './AddCommentStep';
import { QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../../constants/comments';
import AddOptionStep from './AddOptionStep';
import ConfigureCommentStep from '../ConfigureCommentStep';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';

function JobCommentWizard(props) {
  const { investibleId, marketId, commentType } = props;
  const [commentsState] = useContext(CommentsContext);
  const isQuestion = commentType === QUESTION_TYPE;
  const investibleComments = (commentsState[marketId]||[]).filter(comment =>
    comment.investible_id === investibleId) || [];
  const savedQuestion = investibleComments.find((comment) => {
    return comment.comment_type === QUESTION_TYPE && !comment.resolved && !comment.deleted && !comment.is_sent;
  });
  const hasDraft = isQuestion && savedQuestion;
  const draftData = {inlineMarketId: savedQuestion?.inline_market_id, commentId: savedQuestion?.id, groupId:
    savedQuestion?.group_id, marketId, investibleId };

  return (
    <WizardStylesProvider>
      <FormdataWizard name={`job_comment_wizard${investibleId}`} useLocalStorage={false}
                      defaultFormData={hasDraft ? draftData : undefined}>
        {!hasDraft && (
          <AddCommentStep investibleId={investibleId} marketId={marketId} useType={commentType} />
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

