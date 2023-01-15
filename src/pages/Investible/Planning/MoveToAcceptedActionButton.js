import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import PlayForWorkIcon from '@material-ui/icons/PlayForWork'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { getAcceptedStage, } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import StageChangeAction from '../../../components/SidebarActions/Planning/StageChangeAction'

function MoveToAcceptedActionButton(props) {
  const { marketId, disabled, hasAssignedQuestions } = props;
  const [marketStagesState] = useContext(MarketStagesContext);
  const acceptedStage = getAcceptedStage(marketStagesState, marketId);

  if (!acceptedStage) {
    return React.Fragment;
  }

  const translationId = 'planningInvestibleNextStageAcceptedLabel';
  return (
    <StageChangeAction
      {...props}
      icon={hasAssignedQuestions ? <PlayForWorkIcon color="disabled" /> : <PlayForWorkIcon /> }
      targetStageId={acceptedStage.id}
      translationId={translationId}
      operationBlocked={hasAssignedQuestions}
      blockedOperationTranslationId="mustResolveAssignedQuestions"
      explanationId="planningInvestibleAcceptedExplanation"
      disabled={disabled}
    />
  );
}

MoveToAcceptedActionButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  hasAssignedQuestions: PropTypes.bool.isRequired,
  full: PropTypes.bool,
}

MoveToAcceptedActionButton.defaultProps = {
  full: false,
}

export default MoveToAcceptedActionButton;
