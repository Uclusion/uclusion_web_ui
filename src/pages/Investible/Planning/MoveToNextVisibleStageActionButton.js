import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import {
  getAcceptedStage,
  getBlockedStage,
  getInCurrentVotingStage,
  getInReviewStage,
  getRequiredInputStage,
  getVerifiedStage,
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import StageChangeAction from '../../../components/SidebarActions/Planning/StageChangeAction'
import { makeStyles } from '@material-ui/styles'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'

const style = makeStyles(() => {
    return {
      containerYellow: {
        boxShadow: "10px 5px 5px yellow",
        border: '2px solid'
      },
      containerNone: {
        border: '2px solid'
      },
      containerDisabled: {
        border: '2px solid grey'
      },
    };
  }
);

function MoveToNextVisibleStageActionButton(props) {
  const { marketId, currentStageId, disabled, enoughVotes, acceptedStageAvailable, hasTodos } = props;
  const classes = style();
  const [marketStagesState] = useContext(MarketStagesContext);
  const [operationRunning] = useContext(OperationInProgressContext);
  const acceptedStage = getAcceptedStage(marketStagesState, marketId) || {};
  const inReviewStage = getInReviewStage(marketStagesState, marketId) || {};
  const inVotingStage = getInCurrentVotingStage(marketStagesState, marketId) || {};
  const inBlockedStage = getBlockedStage(marketStagesState, marketId) || {};
  const inRequiresInputStage = getRequiredInputStage(marketStagesState, marketId) || {};
  const verifiedStage = getVerifiedStage(marketStagesState, marketId) || {};
  let highlightClass = (disabled || operationRunning) ? classes.containerDisabled : classes.containerNone;
  let destinationStage;
  let destinationExplanation;
  let destinationLabel;
  if (currentStageId === inVotingStage.id) {
    destinationStage = acceptedStage;
    destinationExplanation = 'planningInvestibleAcceptedExplanation';
    destinationLabel = 'planningInvestibleNextStageAcceptedLabel';
    if (!(disabled || operationRunning)) {
      highlightClass = classes.containerYellow;
    }
  } else if (currentStageId === acceptedStage.id) {
    destinationStage = inReviewStage;
    destinationLabel = 'planningInvestibleNextStageInReviewLabel';
    destinationExplanation = 'planningInvestibleInReviewExplanation';
  } else if (currentStageId === inReviewStage.id) {
    destinationStage = verifiedStage;
    destinationLabel = 'planningInvestibleMoveToVerifiedLabel';
    destinationExplanation = 'planningInvestibleVerifiedExplanation';
  } else if ((currentStageId === inBlockedStage.id)||(currentStageId === inRequiresInputStage.id)) {
    if (enoughVotes && acceptedStageAvailable) {
      destinationStage = acceptedStage;
      destinationExplanation = 'planningInvestibleAcceptedExplanation';
      destinationLabel = 'planningInvestibleNextStageAcceptedLabel';
    } else {
      destinationStage = inVotingStage;
      destinationLabel = 'planningInvestibleToVotingLabel';
      destinationExplanation = 'planningInvestibleVotingExplanation';
    }
  }

  if (!destinationStage) {
    return React.Fragment;
  }

  return (
    <div className={highlightClass}>
      <StageChangeAction
        {...props}
        icon={<ArrowUpwardIcon />}
        translationId={destinationLabel}
        explanationId={destinationExplanation}
        currentStageId={currentStageId}
        targetStageId={destinationStage.id}
        operationBlocked={hasTodos && (destinationStage === inReviewStage || destinationStage === verifiedStage)}
        blockedOperationTranslationId="mustRemoveTodosExplanation"
        disabled={disabled}
        isOpen={true}
      />
    </div>
  );
}

MoveToNextVisibleStageActionButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  currentStageId: PropTypes.string.isRequired,
  disabled: PropTypes.bool.isRequired,
  enoughVotes: PropTypes.bool.isRequired,
  acceptedStageAvailable: PropTypes.bool.isRequired,
  hasTodos: PropTypes.bool.isRequired,
};

export default MoveToNextVisibleStageActionButton;
