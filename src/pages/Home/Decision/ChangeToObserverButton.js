import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import VisibilityIcon from '@material-ui/icons/Visibility';
import { changeToObserver } from '../../../api/markets';
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton';
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext';


function ChangeToObserverButton(props) {
  const [operationRunning] = useContext(OperationInProgressContext);
  const { marketId, onClick } = props;

  function myOnClick() {
    return changeToObserver(marketId);
  }

  return (
    <SpinBlockingButton
      marketId={marketId}
      onClick={myOnClick}
      onSpinStop={onClick}
    >
      <TooltipIconButton
        disabled={operationRunning}
        translationId="decisionDialogsBecomeObserver"
        icon={<VisibilityIcon />}
      />
    </SpinBlockingButton>
  );
}

ChangeToObserverButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

ChangeToObserverButton.defaultProps = {
  onClick: () => {},
};

export default ChangeToObserverButton;
