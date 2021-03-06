import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import NotInterestedIcon from '@material-ui/icons/NotInterested'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { getNotDoingStage, } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import StageChangeAction from '../../../components/SidebarActions/Planning/StageChangeAction'

function MoveToNotDoingActionButton(props) {
  const { marketId, disabled } = props;
  const [marketStagesState] = useContext(MarketStagesContext);
  const notDoingStage = getNotDoingStage(marketStagesState, marketId);

  if (!notDoingStage) {
    return React.Fragment;
  }

  return (
    <StageChangeAction
      {...props}
      icon={<NotInterestedIcon />}
      targetStageId={notDoingStage.id}
      translationId="planningInvestibleMoveToNotDoingLabel"
      explanationId="planningInvestibleNotDoingExplanation"
      disabled={disabled}
    />
  );
}

MoveToNotDoingActionButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
};

export default MoveToNotDoingActionButton;
