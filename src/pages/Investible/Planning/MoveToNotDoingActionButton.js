import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import NotInterestedIcon from '@material-ui/icons/NotInterested';
import ExpandableSidebarAction from '../../../components/SidebarActions/ExpandableSidebarAction';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import {
  getNotDoingStage,
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { stageChangeInvestible } from '../../../api/investibles';

function MoveToNotDoingActionButton(props) {
  const { investibleId, marketId, stageId } = props;
  const intl = useIntl();

  const [marketStagesState] = useContext(MarketStagesContext);
  const notDoingStage = getNotDoingStage(marketStagesState, marketId);

  function moveToVerified() {
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: stageId,
        stage_id: notDoingStage.id,
      },
    };
    return stageChangeInvestible(moveInfo);
  }

  return (
    <ExpandableSidebarAction
      icon={<NotInterestedIcon />}
      label={intl.formatMessage({ id: 'planningInvestibleMoveToNotDoingLabel' })}
      onClick={moveToVerified}
    />
  );
}

MoveToNotDoingActionButton.propTypes = {
  investibleId: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
  stageId: PropTypes.string.isRequired,
};

export default MoveToNotDoingActionButton;
