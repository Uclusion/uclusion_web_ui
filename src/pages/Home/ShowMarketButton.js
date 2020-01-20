import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { showMarket } from '../../api/markets';
import TooltipIconButton from '../../components/Buttons/TooltipIconButton';
import LaunchIcon from '@material-ui/icons/Launch';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext';
import { withSpinLock } from '../../components/SpinBlocking/SpinBlockingHOC';

function ShowMarketButton(props) {
  const [operationRunning] = useContext(OperationInProgressContext);
  const {
    onClick,
    marketId,
  } = props;

  function myOnClick() {
    return showMarket(marketId);
  }

  const SpinningTooltipIconButton = withSpinLock(TooltipIconButton);

  return (
    <SpinningTooltipIconButton
      marketId={marketId}
      onClick={myOnClick}
      onSpinStop={onClick}
      disabled={operationRunning}
      key="exit"
      translationId="decisionDialogsRestoreDialog"
      icon={<LaunchIcon />}
    />
  );
}

ShowMarketButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

ShowMarketButton.defaultProps = {
  onClick: () => {
  },
};

export default ShowMarketButton;
