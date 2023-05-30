import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import JobDescriptionApprovalStep from './JobDescriptionApprovalStep';
import FormdataWizard from 'react-formdata-wizard';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import JobApproveStep from './JobApproveStep';

function ApprovalWizard(props) {
  const { marketId, investibleId, message } = props;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  let yourPresence = marketPresences.find((presence) => presence.current_user);
  let yourVote = yourPresence && yourPresence.investments && yourPresence.investments.find((investment) =>
    investment.investible_id === investibleId);
  const parentElementId =  message.type_object_id;

  return (
    <FormdataWizard name={`approval_wizard${investibleId}`} defaultFormData={{parentElementId}}>
      <JobDescriptionApprovalStep marketId={marketId} investibleId={investibleId}
                                  message={message} yourVote={yourVote}/>
      <JobApproveStep marketId={marketId} investibleId={investibleId} message={message} yourVote={yourVote} />
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

