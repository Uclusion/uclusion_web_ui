import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import RateReviewIcon from '@material-ui/icons/RateReview';
import ExpandableSidebarAction from '../../../components/SidebarActions/ExpandableSidebarAction';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import {
  getInReviewStage,
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { stageChangeInvestible } from '../../../api/investibles';

function MoveToInReviewActionButton(props) {
  const { investibleId, marketId, stageId } = props;
  const intl = useIntl();

  const [marketStagesState] = useContext(MarketStagesContext);
  const inReviewStage = getInReviewStage(marketStagesState, marketId);

  function moveToInReview() {
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: stageId,
        stage_id: inReviewStage.id,
      },
    };
    return stageChangeInvestible(moveInfo);
  }

  return (
    <ExpandableSidebarAction
      icon={<RateReviewIcon />}
      label={intl.formatMessage({ id: 'planningInvestibleNextStageInReviewLabel' })}
      onClick={moveToInReview}
    />
  );
}

MoveToInReviewActionButton.propTypes = {
  investibleId: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
  stageId: PropTypes.string.isRequired,
};

export default MoveToInReviewActionButton;
