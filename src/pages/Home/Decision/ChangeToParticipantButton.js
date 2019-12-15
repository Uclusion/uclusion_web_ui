import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import ThumbsUpDownIcon from '@material-ui/icons/ThumbsUpDown';
import { changeToParticipant } from '../../../api/markets';
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext';
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton';


function ChangeToParticipantButton(props) {
  const [operationRunning] = useContext(OperationInProgressContext);
  const { marketId, onClick } = props;

  function myOnClick() {
    return changeToParticipant(marketId);
  }

  return (
    <SpinBlockingButton
      marketId={marketId}
      onClick={myOnClick}
      onSpinStop={onClick}
    >
      <TooltipIconButton
        disabled={operationRunning}
        translationId="decisionDialogsBecomeParticipant"
        icon={<ThumbsUpDownIcon />}
      />
    </SpinBlockingButton>
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
