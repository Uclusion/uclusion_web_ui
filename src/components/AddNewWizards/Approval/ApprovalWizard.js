import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import JobApproveStep from './JobApproveStep';
import {
  getMarketPresences,
  partialUpdateInvestment
} from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { editorEmpty } from '../../TextEditors/Utilities/CoreUtils';
import { JUSTIFY_TYPE } from '../../../constants/comments';
import {
  getMarketComments,
  refreshMarketComments,
  removeComments
} from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../../constants/markets';
import DecisionApproveStep from './DecisionApproveStep';
import { findMessageOfType } from '../../../utils/messageUtils';
import { NOT_FULLY_VOTED_TYPE } from '../../../constants/notifications';
import { removeWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import VoteCertaintyStep from './VoteCertaintyStep';

export function commonQuick(result, commentsDispatch, marketId, commentsState, marketPresencesDispatch, messagesState,
  workItemClasses, messagesDispatch, clearFormData, setOperationRunning, voteMessage) {
  const { commentResult, investmentResult } = result;
  const { commentAction, comment } = commentResult;
  if (commentAction === 'DELETED') {
    const { id: commentId } = comment;
    removeComments(commentsDispatch, marketId, [commentId]);
  } else if (commentAction !== 'NOOP') {
    const comments = getMarketComments(commentsState, marketId);
    refreshMarketComments(commentsDispatch, marketId, [comment, ...comments]);
  }
  partialUpdateInvestment(marketPresencesDispatch, investmentResult, true);
  let useVoteMessage;
  if (messagesState) {
    useVoteMessage = findMessageOfType(NOT_FULLY_VOTED_TYPE, marketId, messagesState);
  } else {
    useVoteMessage = voteMessage;
  }
  if (useVoteMessage) {
    removeWorkListItem(useVoteMessage, workItemClasses.removed, messagesDispatch);
  }
  clearFormData();
  setOperationRunning(false);
}

function ApprovalWizard(props) {
  const { marketId, investibleId, groupId, voteFor } = props;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [commentsState] = useContext(CommentsContext);
  const [marketsState] = useContext(MarketsContext);
  const market = getMarket(marketsState, marketId) || {};
  const { market_type: marketType } = market;
  const marketComments = getMarketComments(commentsState, marketId);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const yourPresence = marketPresences.find((presence) => presence.current_user);
  const yourVote = yourPresence?.investments?.find((investment) => investment.investible_id === investibleId);
  const hasOtherVote = yourPresence?.investments?.find((investment) => investment.investible_id !== investibleId);
  const yourReason = marketComments.find((comment) => comment.created_by === yourPresence?.id &&
    comment.investible_id === investibleId && comment.comment_type === JUSTIFY_TYPE);
  const wasDeleted = yourVote?.deleted;
  const { body } = yourReason || {};
  const approveQuantity = yourVote ? yourVote.quantity : undefined;

  return (
    <WizardStylesProvider>
      <FormdataWizard name="approval_wizard" useLocalStorage={false}
                      defaultFormData={{approveQuantity, originalQuantity: approveQuantity || 0, wasDeleted,
                        userId: yourPresence?.id, approveReason: !editorEmpty(body) ? body : undefined}}>
        {marketType === PLANNING_TYPE && (
          <JobApproveStep marketId={marketId} groupId={groupId} investibleId={investibleId} />
        )}
        {marketType === DECISION_TYPE && (
          <DecisionApproveStep market={market} investibleId={investibleId} hasOtherVote={hasOtherVote} />
        )}
        {marketType === INITIATIVE_TYPE && (
          <VoteCertaintyStep market={market} investibleId={investibleId} isFor={voteFor}  />
        )}
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

ApprovalWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

ApprovalWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default ApprovalWizard;

