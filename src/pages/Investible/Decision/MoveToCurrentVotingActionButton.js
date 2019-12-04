import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import ExpandableSidebarAction from '../../../components/SidebarActions/ExpandableSidebarAction';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import {
  getInCurrentVotingStage,
  getProposedOptionsStage,
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { moveInvestibleToCurrentVoting } from '../../../api/investibles';

function MoveToCurrentVotingActionButton(props) {
  const { onClick, investibleId, marketId } = props;
  const intl = useIntl();

  const [marketStagesState] = useContext(MarketStagesContext);
  const inCurrentVotingStage = getInCurrentVotingStage(marketStagesState, marketId);
  const proposedStage = getProposedOptionsStage(marketStagesState, marketId);

  function moveToProposed() {
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: proposedStage.id,
        stage_id: inCurrentVotingStage.id,
      }
    };
    return moveInvestibleToCurrentVoting(moveInfo)
      .then(() => onClick());
  }

  return (
    <ExpandableSidebarAction
      icon={<ArrowUpwardIcon />}
      label={intl.formatMessage({ id: 'investibleAddToVotingLabel' })}
      onClick={moveToProposed}
    />
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
