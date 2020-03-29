import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import ThumbsUpDownIcon from '@material-ui/icons/ThumbsUpDown';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import {
  getInCurrentVotingStage,
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import StageChangeAction from '../../../components/SidebarActions/Planning/StageChangeAction';

function MoveToVotingActionButton(props) {
  const { marketId } = props;

  const [marketStagesState] = useContext(MarketStagesContext);
  const votingStage = getInCurrentVotingStage(marketStagesState, marketId);

  return (
    <StageChangeAction
      {...props}
      icon={<ThumbsUpDownIcon />}
      targetStageId={votingStage.id}
      translationId="planningInvestibleToVotingLabel"
      explanationId="planningInvestibleVotingExplanation"
    />
  );
}

MoveToVotingActionButton.propTypes = {
  marketId: PropTypes.string.isRequired,
};

export default MoveToVotingActionButton;
