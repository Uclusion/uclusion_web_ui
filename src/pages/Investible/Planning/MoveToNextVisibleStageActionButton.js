import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import {
  getAcceptedStage,
  getInCurrentVotingStage,
  getInReviewStage,
  getVerifiedStage,
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import StageChangeAction from '../../../components/SidebarActions/Planning/StageChangeAction'

function MoveToNextVisibleStageActionButton(props) {
  const { marketId, currentStageId, disabled, highlighted, hasTodos, iconColor } = props;
  const [marketStagesState] = useContext(MarketStagesContext);
  const acceptedStage = getAcceptedStage(marketStagesState, marketId) || {};
  const inReviewStage = getInReviewStage(marketStagesState, marketId) || {};
  const inVotingStage = getInCurrentVotingStage(marketStagesState, marketId) || {};
  const verifiedStage = getVerifiedStage(marketStagesState, marketId) || {};
  let destinationStage;
  let destinationExplanation;
  let destinationLabel;
  if (currentStageId === inVotingStage.id) {
    destinationStage = acceptedStage;
    destinationExplanation = 'planningInvestibleAcceptedExplanation';
    destinationLabel = highlighted ? 'planningInvestibleNextStageAcceptedFullLabel'
      : 'planningInvestibleNextStageAcceptedLabel';
  } else if (currentStageId === acceptedStage.id) {
    destinationStage = inReviewStage;
    destinationLabel = 'planningInvestibleNextStageInReviewLabel';
    destinationExplanation = 'planningInvestibleInReviewExplanation';
  } else if (currentStageId === inReviewStage.id) {
    destinationStage = verifiedStage;
    destinationLabel = 'planningInvestibleMoveToVerifiedLabel';
    destinationExplanation = 'planningInvestibleVerifiedExplanation';
  }

  if (!destinationStage) {
    return React.Fragment;
  }
  const blockedByTodos = hasTodos && destinationStage === verifiedStage;
  return (
    <div>
      <StageChangeAction
        {...props}
        icon={ArrowUpwardIcon}
        iconColor={iconColor}
        translationId={destinationLabel}
        explanationId={destinationExplanation}
        currentStageId={currentStageId}
        targetStageId={destinationStage.id}
        operationBlocked={blockedByTodos}
        highlighted={highlighted}
        blockedOperationTranslationId='mustRemoveTodosExplanation'
        disabled={disabled}
        standAlone
      />
    </div>
  );
}

MoveToNextVisibleStageActionButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  currentStageId: PropTypes.string.isRequired,
  disabled: PropTypes.bool.isRequired,
  hasTodos: PropTypes.bool.isRequired
};

export default MoveToNextVisibleStageActionButton;
