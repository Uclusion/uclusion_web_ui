import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import JobApproveStep from './JobApproveStep';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { editorEmpty } from '../../TextEditors/Utilities/CoreUtils';
import { JUSTIFY_TYPE } from '../../../constants/comments';
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import _ from 'lodash';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../../constants/markets';
import DecisionApproveStep from './DecisionApproveStep';
import InitiativeApproveStep from './InitiativeApproveStep';

function ApprovalWizard(props) {
  const { marketId, investibleId, groupId } = props;
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
  const showDelete = !_.isEmpty(yourVote);
  return (
    <WizardStylesProvider>
      <FormdataWizard name="approval_wizard" useLocalStorage={false}
                      defaultFormData={{approveQuantity, originalQuantity: approveQuantity || 0, wasDeleted, showDelete,
                        userId: yourPresence?.id, approveReason: !editorEmpty(body) ? body : undefined}}>
        {marketType === PLANNING_TYPE && (
          <JobApproveStep marketId={marketId} groupId={groupId} investibleId={investibleId} />
        )}
        {marketType === DECISION_TYPE && (
          <DecisionApproveStep market={market} investibleId={investibleId} />
        )}
        {marketType === INITIATIVE_TYPE && (
          <InitiativeApproveStep marketId={marketId} investibleId={investibleId} hasOtherVote={hasOtherVote} />
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

