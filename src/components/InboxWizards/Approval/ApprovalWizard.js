import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import JobDescriptionApprovalStep from './JobDescriptionApprovalStep'
import FormdataWizard from 'react-formdata-wizard';
import { useHistory } from 'react-router'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { wizardFinish } from '../InboxWizardUtils'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { expandOrContract } from '../../../pages/Home/YourWork/InboxContext';
import JobApproveStep from './JobApproveStep';

function ApprovalWizard(props) {
  const { marketId, investibleId, message, inboxDispatch } = props;
  const history = useHistory();
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  let yourPresence = marketPresences.find((presence) => presence.current_user);
  let yourVote = yourPresence && yourPresence.investments && yourPresence.investments.find((investment) =>
    investment.investible_id === investibleId);
  const parentElementId =  message.type_object_id;
  function myOnFinish(formData) {
    wizardFinish(formData, setOperationRunning, message, history, marketId, investibleId, messagesDispatch);
  }

  return (
    <FormdataWizard name={`approval_wizard${investibleId}`}
                    onStartOver={() => inboxDispatch(expandOrContract(parentElementId))}
                    defaultFormData={{parentElementId}}>
      <JobDescriptionApprovalStep onFinish={myOnFinish} marketId={marketId} investibleId={investibleId}
                                  message={message} yourVote={yourVote}/>
      <JobApproveStep onFinish={myOnFinish} marketId={marketId} investibleId={investibleId} message={message} />
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

