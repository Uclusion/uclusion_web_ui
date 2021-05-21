import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import {
  getInCurrentVotingStage,
  getProposedOptionsStage,
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { moveInvestibleToCurrentVoting } from '../../../api/investibles'
import { ACTION_BUTTON_COLOR, HIGHLIGHTED_BUTTON_COLOR } from '../../../components/Buttons/ButtonConstants'
import { FormattedMessage } from 'react-intl'
import { refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'

function MoveToCurrentVotingActionButton(props) {
  const { onClick, investibleId, marketId, hasIssue } = props;
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, invDispatch] = useContext(InvestiblesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const inCurrentVotingStage = getInCurrentVotingStage(marketStagesState, marketId);
  const proposedStage = getProposedOptionsStage(marketStagesState, marketId);

  function moveToProposed() {
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: proposedStage.id,
        stage_id: inCurrentVotingStage.id,
      },
    };
    return moveInvestibleToCurrentVoting(moveInfo)
      .then((inv) => {
        setOperationRunning(false);
        refreshInvestibles(invDispatch, diffDispatch, [inv]);
        onClick();
      });
  }

  return (
    <SpinningIconLabelButton icon={ArrowUpwardIcon}
                             iconColor={hasIssue ? ACTION_BUTTON_COLOR : HIGHLIGHTED_BUTTON_COLOR}
                             onClick={moveToProposed} noMargin id="investibleAddToVotingButton">
      <FormattedMessage id="investibleAddToVotingLabel" />
    </SpinningIconLabelButton>
  );
}

MoveToCurrentVotingActionButton.propTypes = {
  onClick: PropTypes.func,
  investibleId: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
};

MoveToCurrentVotingActionButton.defaultProps = {
  onClick: () => {},
};

export default MoveToCurrentVotingActionButton;
