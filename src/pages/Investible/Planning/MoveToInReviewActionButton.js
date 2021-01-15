import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import RateReviewIcon from '@material-ui/icons/RateReview'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { getInReviewStage, } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import StageChangeAction from '../../../components/SidebarActions/Planning/StageChangeAction'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'

function MoveToInReviewActionButton(props) {
  const { marketId, disabled, hasTodos, hasAssignedQuestions } = props;
  const [marketStagesState] = useContext(MarketStagesContext);
  const inReviewStage = getInReviewStage(marketStagesState, marketId);
  const [operationRunning] = useContext(OperationInProgressContext);

  if (!inReviewStage) {
    return React.Fragment;
  }
  const operationBlocked = hasTodos || hasAssignedQuestions;
  return (
    <StageChangeAction
      {...props}
      icon={operationBlocked ? <RateReviewIcon color="disabled" /> : <RateReviewIcon />}
      targetStageId={inReviewStage.id}
      translationId="planningInvestibleNextStageInReviewLabel"
      explanationId="planningInvestibleInReviewExplanation"
      disabled={operationRunning || disabled}
      operationBlocked={operationBlocked}
      blockedOperationTranslationId={hasTodos ? 'mustRemoveTodosExplanation' : 'mustResolveAssignedQuestions'}
    />
  );
}

MoveToInReviewActionButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  disabled: PropTypes.bool.isRequired,
  hasTodos: PropTypes.bool.isRequired,
  hasAssignedQuestions: PropTypes.bool.isRequired
}

export default MoveToInReviewActionButton;
