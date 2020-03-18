import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import {
  getAcceptedStage, getInReviewStage,
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { formMarketLink, navigate } from '../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import StageChangeAction from '../../../components/SidebarActions/Planning/StageChangeAction';

function MoveToNextVisibleStageActionButton(props) {
  const { marketId, currentStageId } = props;
  const history = useHistory();
  const [marketStagesState] = useContext(MarketStagesContext);
  const acceptedStage = getAcceptedStage(marketStagesState, marketId);
  let destinationStage = acceptedStage;
  let destinationLabel = 'planningInvestibleNextStageAcceptedLabel';
  if (currentStageId === acceptedStage.id) {
    destinationStage = getInReviewStage(marketStagesState, marketId);
    destinationLabel = 'planningInvestibleNextStageInReviewLabel';
  }


  return (
    <StageChangeAction
      {...props}
      icon={<ArrowUpwardIcon />}
      translationId={destinationLabel}
      targetStageId={destinationStage.id}
      onSpinStop={() => navigate(history, formMarketLink(marketId))}
    />
  );
}

MoveToNextVisibleStageActionButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  currentStageId: PropTypes.string.isRequired,
};

export default MoveToNextVisibleStageActionButton;
