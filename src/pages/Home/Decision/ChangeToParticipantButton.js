import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import ThumbsUpDownIcon from '@material-ui/icons/ThumbsUpDown';
import { changeToParticipant } from '../../../api/markets';
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext';
import { withSpinLock } from '../../../components/SpinBlocking/SpinBlockingHOC';


function ChangeToParticipantButton(props) {
  const [operationRunning] = useContext(OperationInProgressContext);
  const { marketId, onClick } = props;

  function myOnClick() {
    return changeToParticipant(marketId);
  }
  const SpinningTooltipIconButton = withSpinLock(TooltipIconButton);
  return (
    <SpinningTooltipIconButton
      marketId={marketId}
      onClick={myOnClick}
      onSpinStop={onClick}
      disabled={operationRunning}
      translationId="decisionDialogsBecomeParticipant"
      icon={<ThumbsUpDownIcon />}
    />
  );
}

ChangeToParticipantButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

ChangeToParticipantButton.defaultProps = {
  onClick: () => {},
};

export default ChangeToParticipantButton;
