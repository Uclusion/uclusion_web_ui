import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import DecideAssignStep from './DecideAssignStep';
import RejectStep from '../RejectStep';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';

function AssignToOtherWizard(props) {
  const { marketId, investibleId, rowId, typeObjectId } = props;
  const [investiblesState] = useContext(InvestiblesContext);
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage: currentStageId, group_id: groupId } = marketInfo || {};

  return (
    <FormdataWizard name={`assign_other_wizard${investibleId}`} defaultFormData={{parentElementId: rowId}}>
      <DecideAssignStep marketId={marketId} investibleId={investibleId} />
      <RejectStep marketId={marketId} investibleId={investibleId} groupId={groupId}
                  currentStageId={currentStageId} typeObjectId={typeObjectId} />
    </FormdataWizard>
  );
}

AssignToOtherWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

export default AssignToOtherWizard;

