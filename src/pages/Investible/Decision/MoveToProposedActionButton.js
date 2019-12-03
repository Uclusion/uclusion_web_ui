import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import ExpandableSidebarAction from '../../../components/SidebarActions/ExpandableSidebarAction';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import {
  getInCurrentVotingStage,
  getProposedOptionsStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { moveInvestibleToProposed } from '../../../api/investibles';

function MoveToProposedActionButton(props) {
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
        stage_id: proposedStage.id,
        current_stage_id: inCurrentVotingStage.id,
      }
    };
    return moveInvestibleToProposed(moveInfo)
      .then(() => onClick());
  }

  return (
    <ExpandableSidebarAction
      icon={<ArrowDownwardIcon />}
      label={intl.formatMessage({ id: 'investibleRemoveFromVotingLabel' })}
      onClick={moveToProposed}
    />
  );
}

MoveToProposedActionButton.propTypes = {
  onClick: PropTypes.func,
  investibleId: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
};

MoveToProposedActionButton.defaultProps = {
  onClick: () => {},
};

export default MoveToProposedActionButton;
