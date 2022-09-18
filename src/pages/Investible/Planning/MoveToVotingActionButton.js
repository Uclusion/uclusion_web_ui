import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import ThumbsUpDownIcon from '@material-ui/icons/ThumbsUpDown'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { getInCurrentVotingStage, } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import StageChangeAction from '../../../components/SidebarActions/Planning/StageChangeAction'
import { useMediaQuery, useTheme } from '@material-ui/core'

function MoveToVotingActionButton(props) {
  const { marketId, disabled, hasAssignedQuestions } = props
  const theme = useTheme()
  const mobileLayout = useMediaQuery(theme.breakpoints.down('md'))
  const [marketStagesState] = useContext(MarketStagesContext)
  const votingStage = getInCurrentVotingStage(marketStagesState, marketId)

  if (!votingStage) {
    return React.Fragment
  }

  return (
    <StageChangeAction
      {...props}
      icon={hasAssignedQuestions ? <ThumbsUpDownIcon color="disabled" /> : <ThumbsUpDownIcon />}
      targetStageId={votingStage.id}
      translationId={mobileLayout ? 'planningMobileToVotingLabel' : 'planningInvestibleToVotingLabel'}
      explanationId="planningInvestibleVotingExplanation"
      operationBlocked={hasAssignedQuestions}
      blockedOperationTranslationId="mustResolveAssignedQuestions"
      disabled={disabled}
    />
  );
}

MoveToVotingActionButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  hasAssignedQuestions: PropTypes.bool.isRequired
}
MoveToVotingActionButton.defaultProps = {
  disabled: false,
};

export default MoveToVotingActionButton;
