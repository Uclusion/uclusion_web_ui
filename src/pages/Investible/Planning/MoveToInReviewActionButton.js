import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import RateReviewIcon from '@material-ui/icons/RateReview'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { getInReviewStage, } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import StageChangeAction from '../../../components/SidebarActions/Planning/StageChangeAction'

function MoveToInReviewActionButton(props) {
  const { marketId, disabled, hasTodos } = props;
  const [marketStagesState] = useContext(MarketStagesContext);
  const inReviewStage = getInReviewStage(marketStagesState, marketId);

  if (!inReviewStage) {
    return React.Fragment;
  }

  return (
    <StageChangeAction
      {...props}
      icon={<RateReviewIcon />}
      targetStageId={inReviewStage.id}
      translationId="planningInvestibleNextStageInReviewLabel"
      explanationId="planningInvestibleInReviewExplanation"
      disabled={disabled}
      operationBlocked={hasTodos}
      blockedOperationTranslationId="mustRemoveTodosExplanation"
    />
  );
}

MoveToInReviewActionButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  disabled: PropTypes.bool.isRequired,
  hasTodos: PropTypes.bool.isRequired,
};

export default MoveToInReviewActionButton;
