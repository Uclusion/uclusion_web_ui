import React, { useContext } from 'react'
import PropTypes from 'prop-types';
import { changeUserToObserver } from '../../api/markets';
import VolumeOffIcon from '@material-ui/icons/VolumeOff';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { withSpinLock } from '../../components/SpinBlocking/SpinBlockingHOC'
import TooltipIconButton from '../../components/Buttons/TooltipIconButton'


function ChangeToObserverButton(props) {
  const [operationRunning] = useContext(OperationInProgressContext);
  const { marketId } = props;
  const SpinningTooltipIconButton = withSpinLock(TooltipIconButton);

  function myOnClick() {
    return changeUserToObserver(marketId);
  }

  return (
    <SpinningTooltipIconButton
      marketId={marketId}
      onClick={myOnClick}
      disabled={operationRunning}
      key="subscribe"
      translationId="decisionDialogsBecomeObserver"
      icon={<VolumeOffIcon />}
    />
  );
}

ChangeToObserverButton.propTypes = {
  marketId: PropTypes.string.isRequired,
};

export default ChangeToObserverButton;
