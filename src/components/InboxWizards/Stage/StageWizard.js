import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import DoneVotingStep from './DoneVotingStep';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import RejectStep from '../RejectStep';
import OtherOptionsStep from './OtherOptionsStep';
import { getMessageId } from '../../../contexts/NotificationsContext/notificationsContextHelper';

function StageWizard(props) {
  // message is present when opened from an inbox approval row (B-all-524); the wizard then
  // dismisses that row instead of offering Poke
  const { marketId, investibleId, rowId, typeObjectId, message } = props;
  const [investiblesState] = useContext(InvestiblesContext);
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage: currentStageId, group_id: groupId } = marketInfo || {};
  const parentElementId = message ? getMessageId(message) : rowId;
  const wizardTypeObjectId = message ? message.type_object_id : typeObjectId;

  return (
    <FormdataWizard name={`stage_wizard${investibleId}`} useLocalStorage={false}
                    defaultFormData={{parentElementId, useCompression: true}}>
      <DoneVotingStep marketId={marketId} investibleId={investibleId} groupId={groupId}
                      typeObjectId={wizardTypeObjectId} message={message} />
      <OtherOptionsStep marketId={marketId} investibleId={investibleId} groupId={groupId}
                      typeObjectId={wizardTypeObjectId} />
      <RejectStep marketId={marketId} investibleId={investibleId} groupId={groupId}
                      currentStageId={currentStageId} typeObjectId={wizardTypeObjectId} />
    </FormdataWizard>
  );
}

StageWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

export default StageWizard;

