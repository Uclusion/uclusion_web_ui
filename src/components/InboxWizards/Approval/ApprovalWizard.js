import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import JobApproveStep from './JobApproveStep';
import ChooseCommentTypeStep from '../ChooseCommentTypeStep';
import { getMessageId } from '../../../contexts/NotificationsContext/notificationsContextHelper';

function ApprovalWizard(props) {
  const { marketId, investibleId, message, isAssigned } = props;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const yourPresence = marketPresences.find((presence) => presence.current_user);
  const yourVote = yourPresence?.investments?.find((investment) => investment.investible_id === investibleId);
  const parentElementId =  getMessageId(message);

  return (
    <FormdataWizard name={`approval_wizard${investibleId}`}
                    defaultFormData={{parentElementId, approveQuantity: yourVote?.quantity}}>
      <JobApproveStep marketId={marketId} investibleId={investibleId} message={message} yourVote={yourVote}
                      isAssigned={isAssigned}/>
      <ChooseCommentTypeStep investibleId={investibleId} marketId={marketId} message={message} />
    </FormdataWizard>
  );
}

ApprovalWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

export default ApprovalWizard;

