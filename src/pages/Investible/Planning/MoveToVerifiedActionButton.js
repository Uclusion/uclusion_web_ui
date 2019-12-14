import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import VerifiedUserIcon from '@material-ui/icons/VerifiedUser';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import {
  getVerifiedStage,
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { stageChangeInvestible } from '../../../api/investibles';
import SpinBlockingSidebarAction from '../../../components/SpinBlocking/SpinBlockingSidebarAction';

function MoveToVerfiedActionButton(props) {
  const { investibleId, marketId, stageId } = props;
  const intl = useIntl();

  const [marketStagesState] = useContext(MarketStagesContext);
  const verifiedStage = getVerifiedStage(marketStagesState, marketId);

  function moveToVerified() {
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: stageId,
        stage_id: verifiedStage.id,
      },
    };
    return stageChangeInvestible(moveInfo);
  }

  return (
    <SpinBlockingSidebarAction
      marketId={marketId}
      icon={<VerifiedUserIcon />}
      label={intl.formatMessage({ id: 'planningInvestibleMoveToVerifiedLabel' })}
      onClick={moveToVerified}
    />
  );
}

MoveToVerfiedActionButton.propTypes = {
  investibleId: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
  stageId: PropTypes.string.isRequired,
};

export default MoveToVerfiedActionButton;
