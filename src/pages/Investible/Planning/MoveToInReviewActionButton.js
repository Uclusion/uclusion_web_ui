import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import RateReviewIcon from '@material-ui/icons/RateReview'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { getInReviewStage, } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import StageChangeAction from '../../../components/SidebarActions/Planning/StageChangeAction'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { useMediaQuery, useTheme } from '@material-ui/core'

function MoveToInReviewActionButton(props) {
  const { marketId, disabled, hasAssignedQuestions } = props
  const [marketStagesState] = useContext(MarketStagesContext)
  const inReviewStage = getInReviewStage(marketStagesState, marketId)
  const [operationRunning] = useContext(OperationInProgressContext)
  const theme = useTheme()
  const mobileLayout = useMediaQuery(theme.breakpoints.down('md'))

  if (!inReviewStage) {
    return React.Fragment
  }

  return (
    <StageChangeAction
      {...props}
      icon={hasAssignedQuestions ? <RateReviewIcon color="disabled"/> : <RateReviewIcon/>}
      targetStageId={inReviewStage.id}
      translationId={mobileLayout ? 'planningInvestibleMobileInReviewLabel' : 'planningInvestibleNextStageInReviewLabel'}
      explanationId="planningInvestibleInReviewExplanation"
      disabled={operationRunning !== false || disabled}
      operationBlocked={hasAssignedQuestions}
      blockedOperationTranslationId="mustResolveAssignedQuestions"
    />
  );
}

MoveToInReviewActionButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  hasAssignedQuestions: PropTypes.bool.isRequired
}

export default MoveToInReviewActionButton;
