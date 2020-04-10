import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import ThumbsUpDownIcon from '@material-ui/icons/ThumbsUpDown'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { getInCurrentVotingStage, } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import StageChangeAction from '../../../components/SidebarActions/Planning/StageChangeAction'

function MoveToVotingActionButton(props) {
  const { marketId, disabled } = props;

  const [marketStagesState] = useContext(MarketStagesContext);
  const votingStage = getInCurrentVotingStage(marketStagesState, marketId);

  if (!votingStage) {
    return React.Fragment;
  }

  return (
    <StageChangeAction
      {...props}
      icon={<ThumbsUpDownIcon />}
      targetStageId={votingStage.id}
      translationId="planningInvestibleToVotingLabel"
      explanationId="planningInvestibleVotingExplanation"
      disabled={disabled}
    />
  );
}

MoveToVotingActionButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  disabled: PropTypes.bool.isRequired,
};

export default MoveToVotingActionButton;
