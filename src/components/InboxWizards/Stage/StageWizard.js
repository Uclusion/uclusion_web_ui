import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import FormdataWizard from 'react-formdata-wizard';
import DecideStageStep from './DecideStageStep';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';

function StageWizard(props) {
  const { marketId, investibleId, rowId } = props;
  const [investiblesState] = useContext(InvestiblesContext);
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage: currentStageId, group_id: groupId } = marketInfo || {};

  return (
    <FormdataWizard name={`stage_wizard${investibleId}`} defaultFormData={{parentElementId: rowId}}>
      <DecideStageStep marketId={marketId} investibleId={investibleId} currentStageId={currentStageId}
                       groupId={groupId} />
    </FormdataWizard>
  );
}

StageWizard.propTypes = {
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

StageWizard.defaultProps = {
  onFinish: () => {},
  showCancel: true
}

export default StageWizard;

