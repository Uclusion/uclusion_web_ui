import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import JobDescriptionApprovalStep from './JobDescriptionApprovalStep'
import FormdataWizard from 'react-formdata-wizard';
import { useHistory } from 'react-router'
import ActionApprovalStep from './ActionApprovalStep'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { wizardFinish } from '../InboxWizardUtils'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';

function ApprovalWizard(props) {
  const { marketId, investibleId, message } = props;
  const history = useHistory();
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  let yourPresence = marketPresences.find((presence) => presence.current_user);
  let yourVote = yourPresence && yourPresence.investments && yourPresence.investments.find((investment) =>
    investment.investible_id === investibleId);

  function myOnFinish(formData) {
    wizardFinish(formData, setOperationRunning, message, history, marketId, investibleId);
  }

  return (
    <FormdataWizard name={`approval_wizard${investibleId}`}>
      <JobDescriptionApprovalStep onFinish={myOnFinish} marketId={marketId} investibleId={investibleId}
                                  message={message} yourVote={yourVote}/>
      <ActionApprovalStep onFinish={myOnFinish} marketId={marketId} investibleId={investibleId} message={message} />
    </FormdataWizard>
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

