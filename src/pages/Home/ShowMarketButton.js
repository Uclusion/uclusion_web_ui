import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { showMarket } from '../../api/markets';
import TooltipIconButton from '../../components/Buttons/TooltipIconButton';
import LaunchIcon from '@material-ui/icons/Launch';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import { withSpinLock } from '../../components/SpinBlocking/SpinBlockingHOC';
import { navigate } from '../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';

function ShowMarketButton(props) {
  const [operationRunning] = useContext(OperationInProgressContext);
  const {
    marketId,
  } = props;

  const history = useHistory();

  function myOnClick() {
    return showMarket(marketId);
  }

  const SpinningTooltipIconButton = withSpinLock(TooltipIconButton);

  return (
    <SpinningTooltipIconButton
      marketId={marketId}
      onClick={myOnClick}
      onSpinStop={() => navigate(history, '/')}
      disabled={operationRunning}
      key="exit"
      translationId="decisionDialogsRestoreDialog"
      icon={<LaunchIcon />}
    />
  );
}

ShowMarketButton.propTypes = {
  marketId: PropTypes.string.isRequired,
};


export default ShowMarketButton;
