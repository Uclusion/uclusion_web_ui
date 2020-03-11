import React, { useContext } from 'react';
import VolumeUpIcon from '@material-ui/icons/VolumeUp';
import PropTypes from 'prop-types';
import { changeUserToParticipant } from '../../api/markets';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import { withSpinLock } from '../../components/SpinBlocking/SpinBlockingHOC';
import TooltipIconButton from '../../components/Buttons/TooltipIconButton';

function ChangeToParticipantButton(props) {
  const [operationRunning] = useContext(OperationInProgressContext);
  const { marketId } = props;
  const SpinningTooltipIconButton = withSpinLock(TooltipIconButton);

  function myOnClick() {
    return changeUserToParticipant(marketId);
  }

  return (
    <SpinningTooltipIconButton
      marketId={marketId}
      onClick={myOnClick}
      disabled={operationRunning}
      key="subscribe"
      translationId="decisionDialogsBecomeParticipant"
      icon={<VolumeUpIcon />}
    />
  );
}

ChangeToParticipantButton.propTypes = {
  marketId: PropTypes.string.isRequired,
};

export default ChangeToParticipantButton;
