import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import PlayForWorkIcon from '@material-ui/icons/PlayForWork'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { getAcceptedStage, } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import StageChangeAction from '../../../components/SidebarActions/Planning/StageChangeAction'

function MoveToAcceptedActionButton(props) {
  const { marketId, disabled } = props;
  const [marketStagesState] = useContext(MarketStagesContext);
  const acceptedStage = getAcceptedStage(marketStagesState, marketId);

  if (!acceptedStage) {
    return React.Fragment;
  }

  return (
    <StageChangeAction
      {...props}
      icon={<PlayForWorkIcon />}
      targetStageId={acceptedStage.id}
      translationId="planningInvestibleNextStageAcceptedLabel"
      explanationId="planningInvestibleAcceptedExplanation"
      disabled={disabled}
    />
  );
}

MoveToAcceptedActionButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  disabled: PropTypes.bool.isRequired,
};

export default MoveToAcceptedActionButton;
