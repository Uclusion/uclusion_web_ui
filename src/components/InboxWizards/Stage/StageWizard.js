import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import FormdataWizard from 'react-formdata-wizard';
import DecideStageStep from './DecideStageStep'
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { getAcceptedStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import StartReviewStep from './StartReviewStep';

function StageWizard(props) {
  const { marketId, investibleId, rowId } = props;
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage: currentStageId, group_id: groupId } = marketInfo || {};
  const acceptedStage = getAcceptedStage(marketStagesState, marketId) || {};

  return (
    <FormdataWizard name={`stage_wizard${investibleId}`} defaultFormData={{parentElementId: rowId}}>
      <DecideStageStep marketId={marketId} investibleId={investibleId} currentStageId={currentStageId} />
      {currentStageId === acceptedStage.id && (
        <StartReviewStep marketId={marketId} investibleId={investibleId} inv={inv} groupId={groupId}
                         currentStageId={currentStageId} />
      )}
    </FormdataWizard>
  );
}

StageWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

StageWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default StageWizard;

