import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import JobApproveStep from './JobApproveStep';

function ApprovalWizard(props) {
  const { marketId, investibleId, message, isAssigned } = props;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const yourPresence = marketPresences.find((presence) => presence.current_user);
  const yourVote = yourPresence?.investments?.find((investment) => investment.investible_id === investibleId);
  const parentElementId =  message.type_object_id;

  return (
    <FormdataWizard name={`approval_wizard${investibleId}`}
                    defaultFormData={{parentElementId, approveQuantity: yourVote?.quantity}}>
      <JobApproveStep marketId={marketId} investibleId={investibleId} message={message} yourVote={yourVote}
                      isAssigned={isAssigned}/>
    </FormdataWizard>
  );
}

ApprovalWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

ApprovalWizard.defaultProps = {
  onFinish: () => {},
  showCancel: true
}

export default ApprovalWizard;

