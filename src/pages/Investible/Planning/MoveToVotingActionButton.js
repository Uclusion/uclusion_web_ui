import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import ThumbsUpDownIcon from '@material-ui/icons/ThumbsUpDown';
import ExpandableSidebarAction from '../../../components/SidebarActions/ExpandableSidebarAction';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import {
  getInCurrentVotingStage,
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { stageChangeInvestible } from '../../../api/investibles';

function MoveToVotingActionButton(props) {
  const { investibleId, marketId, stageId } = props;
  const intl = useIntl();

  const [marketStagesState] = useContext(MarketStagesContext);
  const votingStage = getInCurrentVotingStage(marketStagesState, marketId);

  function moveToVoting() {
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: stageId,
        stage_id: votingStage.id,
      },
    };
    return stageChangeInvestible(moveInfo);
  }

  return (
    <ExpandableSidebarAction
      icon={<ThumbsUpDownIcon />}
      label={intl.formatMessage({ id: 'investibleAddToVotingLabel' })}
      onClick={moveToVoting}
    />
  );
}

MoveToVotingActionButton.propTypes = {
  investibleId: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
  stageId: PropTypes.string.isRequired,
};

export default MoveToVotingActionButton;
