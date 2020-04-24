import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { getAcceptedStage, getInReviewStage, } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import StageChangeAction from '../../../components/SidebarActions/Planning/StageChangeAction'

function MoveToNextVisibleStageActionButton(props) {
  const { marketId, currentStageId, disabled } = props;
  const [marketStagesState] = useContext(MarketStagesContext);
  const acceptedStage = getAcceptedStage(marketStagesState, marketId) || {};
  let destinationStage = acceptedStage;
  let destinationExplanation = 'planningInvestibleAcceptedExplanation';
  let destinationLabel = 'planningInvestibleNextStageAcceptedLabel';
  if (currentStageId === acceptedStage.id) {
    destinationStage = getInReviewStage(marketStagesState, marketId);
    destinationLabel = 'planningInvestibleNextStageInReviewLabel';
    destinationExplanation = 'planningInvestibleInReviewExplanation';
  }

  if (!destinationStage) {
    return React.Fragment;
  }

  return (
    <StageChangeAction
      {...props}
      icon={<ArrowUpwardIcon />}
      translationId={destinationLabel}
      explanationId={destinationExplanation}
      targetStageId={destinationStage.id}
      disabled={disabled}
    />
  );
}

MoveToNextVisibleStageActionButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  currentStageId: PropTypes.string.isRequired,
  disabled: PropTypes.bool.isRequired,
};

export default MoveToNextVisibleStageActionButton;
