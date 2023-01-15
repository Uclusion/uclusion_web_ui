import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import WorkIcon from '@material-ui/icons/Work'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { getFurtherWorkStage, } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import StageChangeAction from '../../../components/SidebarActions/Planning/StageChangeAction'

function MoveToFurtherWorkActionButton(props) {
  const { marketId, disabled } = props;

  const [marketStagesState] = useContext(MarketStagesContext);
  const furtherWorkStage = getFurtherWorkStage(marketStagesState, marketId);

  if (!furtherWorkStage) {
    return React.Fragment;
  }

  return (
    <StageChangeAction
      { ...props }
      icon={<WorkIcon />}
      targetStageId={furtherWorkStage.id}
      translationId="planningInvestibleMoveToFurtherWorkLabel"
      explanationId="planningInvestibleFurtherWorkExplanation"
      disabled={disabled}
    />
  );
}

MoveToFurtherWorkActionButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
};

export default MoveToFurtherWorkActionButton;
