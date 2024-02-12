import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import DecideFeedbackStep from './DecideFeedbackStep';
import RejectStep from '../RejectStep';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';

function FeedbackWizard(props) {
  const { marketId, investibleId, message } = props;
  const parentElementId =  message.type_object_id;
  const [investiblesState] = useContext(InvestiblesContext);
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage: currentStageId, group_id: groupId } = marketInfo || {};

  return (
    <FormdataWizard name={`feedback_wizard${investibleId}`} defaultFormData={{parentElementId, useCompression: true}}>
      <DecideFeedbackStep marketId={marketId} investibleId={investibleId} message={message}
                          currentStageId={currentStageId}/>
      <RejectStep marketId={marketId} investibleId={investibleId} groupId={groupId}
                  currentStageId={currentStageId} typeObjectId={parentElementId} />
    </FormdataWizard>
  );
}

FeedbackWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

FeedbackWizard.defaultProps = {
  onFinish: () => {},
  showCancel: true
}

export default FeedbackWizard;

