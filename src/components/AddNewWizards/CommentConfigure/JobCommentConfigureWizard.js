import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import ConfigureCommentStep from '../ConfigureCommentStep';
import { getComment } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { QUESTION_TYPE } from '../../../constants/comments';

function JobCommentConfigureWizard(props) {
  const { marketId, commentId, typeObjectId } = props;
  const [commentsState] = useContext(CommentsContext);
  const [marketsState] = useContext(MarketsContext);
  const comment = getComment(commentsState, marketId, commentId);
  const inlineMarket = getMarket(marketsState, comment?.inline_market_id);
  if (!comment || (comment.comment_type === QUESTION_TYPE && !inlineMarket)) {
    return React.Fragment;
  }

  return (
    <WizardStylesProvider>
      <FormdataWizard name={`job_comment_configure_wizard${commentId}`} useLocalStorage={false}>
        <ConfigureCommentStep useType={comment.comment_type} comment={comment} navigateOnFinish investibleId={comment.investible_id}
                              typeObjectId={typeObjectId} marketId={comment.market_id} groupId={comment.group_id}
                              allowMulti={inlineMarket?.allow_multi_vote} />
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

JobCommentConfigureWizard.propTypes = {
  marketId: PropTypes.string.isRequired,
  commentId: PropTypes.string.isRequired
};
export default JobCommentConfigureWizard;

