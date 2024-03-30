import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import JobApproveStep from './JobApproveStep';
import {
  getMarketPresences, getReasonForVote,
  partialUpdateInvestment
} from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { editorEmpty } from '../../TextEditors/Utilities/CoreUtils';
import {
  addMarketComments,
  getMarketComments
} from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../../constants/markets';
import DecisionApproveStep from './DecisionApproveStep';
import { findMessageOfType } from '../../../utils/messageUtils';
import { NOT_FULLY_VOTED_TYPE, UNREAD_JOB_APPROVAL_REQUEST } from '../../../constants/notifications';
import { dismissWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import VoteCertaintyStep from './VoteCertaintyStep';
import _ from 'lodash';

export function commonQuick(result, commentsDispatch, marketId, commentsState, marketPresencesDispatch, messagesState,
  messagesDispatch, setOperationRunning, voteMessage) {
  const { commentResult, investmentResult } = result;
  const { commentAction, comment } = commentResult;
  if (commentAction !== 'NOOP') {
    addMarketComments(commentsDispatch, marketId, [comment]);
  }
  partialUpdateInvestment(marketPresencesDispatch, investmentResult, true);
  let useVoteMessage;
  if (messagesState) {
    useVoteMessage = findMessageOfType(NOT_FULLY_VOTED_TYPE, marketId, messagesState);
    if (!useVoteMessage) {
      useVoteMessage = findMessageOfType(UNREAD_JOB_APPROVAL_REQUEST, marketId, messagesState);
    }
  } else {
    useVoteMessage = voteMessage;
  }
  if (useVoteMessage) {
    dismissWorkListItem(useVoteMessage, messagesDispatch);
  }
  setOperationRunning(false);
}

function ApprovalWizard(props) {
  const { marketId, investibleId, groupId, voteFor } = props;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [commentsState] = useContext(CommentsContext);
  const [marketsState] = useContext(MarketsContext);
  const market = getMarket(marketsState, marketId) || {};
  const { market_type: marketType } = market;
  const marketComments = getMarketComments(commentsState, marketId, groupId);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const yourPresence = marketPresences.find((presence) => presence.current_user);
  const yourVote = yourPresence?.investments?.find((investment) => investment.investible_id === investibleId);
  const hasOtherVote = yourPresence?.investments?.find((investment) => investment.investible_id !== investibleId);
  const yourReason = getReasonForVote(yourVote, marketComments);
  const wasDeleted = yourVote?.deleted;
  const { body } = yourReason || {};
  const approveQuantity = yourVote?.quantity || 0;
  if (!marketType) {
    return React.Fragment;
  }
  const originalReason = !editorEmpty(body) ? body : undefined;
  return (
    <WizardStylesProvider>
      <FormdataWizard name={`approval_wizard${investibleId}`} useLocalStorage={false}
                      defaultFormData={{approveQuantity: Math.abs(approveQuantity),
                        originalQuantity: approveQuantity, wasDeleted, useCompression: true,
                        userId: yourPresence?.id, approveReason: originalReason, originalReason}}>
        {marketType === PLANNING_TYPE && (
          <JobApproveStep marketId={marketId} groupId={groupId} investibleId={investibleId}
                          currentReasonId={yourReason?.id} />
        )}
        {marketType === DECISION_TYPE && (
          <DecisionApproveStep market={market} investibleId={investibleId} hasOtherVote={hasOtherVote}
                               currentReasonId={yourReason?.id} />
        )}
        {marketType === INITIATIVE_TYPE && (
          <VoteCertaintyStep market={market} investibleId={investibleId} currentReasonId={yourReason?.id}
                             showSwitch={!wasDeleted && !_.isEmpty(yourVote)}
                             wasDeleted={wasDeleted}
                             isFor={yourVote ? approveQuantity >= 0 : voteFor==='true'}  />
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

