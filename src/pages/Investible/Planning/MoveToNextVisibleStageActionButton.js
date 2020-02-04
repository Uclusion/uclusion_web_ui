import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import SpinBlockingSidebarAction from '../../../components/SpinBlocking/SpinBlockingSidebarAction';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import {
  getAcceptedStage, getInReviewStage,
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { stageChangeInvestible } from '../../../api/investibles';
import { formMarketLink, navigate } from '../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'

function MoveToNextVisibleStageActionButton(props) {
  const { investibleId, marketId, stageId } = props;
  const intl = useIntl();
  const history = useHistory();
  const [marketStagesState] = useContext(MarketStagesContext);
  const acceptedStage = getAcceptedStage(marketStagesState, marketId);
  let destinationStage = acceptedStage;
  let destinationLabel = 'planningInvestibleNextStageAcceptedLabel';
  if (stageId === acceptedStage.id) {
    destinationStage = getInReviewStage(marketStagesState, marketId);
    destinationLabel = 'planningInvestibleNextStageInReviewLabel';
  }

  function moveToNext() {
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: stageId,
        stage_id: destinationStage.id,
      },
    };
    return stageChangeInvestible(moveInfo).then(() => navigate(history, formMarketLink(marketId)));
  }

  return (
    <SpinBlockingSidebarAction
      marketId={marketId}
      icon={<ArrowUpwardIcon />}
      label={intl.formatMessage({ id: destinationLabel })}
      onClick={moveToNext}
    />
  );
}

MoveToNextVisibleStageActionButton.propTypes = {
  investibleId: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
  stageId: PropTypes.string.isRequired,
};

export default MoveToNextVisibleStageActionButton;
