import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import PlayForWorkIcon from '@material-ui/icons/PlayForWork';
import SpinBlockingSidebarAction from '../../../components/SpinBlocking/SpinBlockingSidebarAction';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import {
  getAcceptedStage,
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { stageChangeInvestible } from '../../../api/investibles';


function MoveToAcceptedActionButton(props) {
  const { investibleId, marketId, stageId } = props;
  const intl = useIntl();

  const [marketStagesState] = useContext(MarketStagesContext);
  const acceptedStage = getAcceptedStage(marketStagesState, marketId);

  function moveToAccepted() {
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: stageId,
        stage_id: acceptedStage.id,
      },
    };
    return stageChangeInvestible(moveInfo);
  }

  return (
    <SpinBlockingSidebarAction
      marketId={marketId}
      icon={<PlayForWorkIcon />}
      label={intl.formatMessage({ id: 'planningInvestibleNextStageAcceptedLabel' })}
      onClick={moveToAccepted}
    />
  );
}

MoveToAcceptedActionButton.propTypes = {
  investibleId: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
  stageId: PropTypes.string.isRequired,
};

export default MoveToAcceptedActionButton;
