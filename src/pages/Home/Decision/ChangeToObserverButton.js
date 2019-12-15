import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import VisibilityIcon from '@material-ui/icons/Visibility';
import { changeToObserver } from '../../../api/markets';
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext';
import { withSpinLock } from '../../../components/SpinBlocking/SpinBlockingHOC';


function ChangeToObserverButton(props) {
  const [operationRunning] = useContext(OperationInProgressContext);
  const { marketId, onClick } = props;

  function myOnClick() {
    return changeToObserver(marketId);
  }

  const SpinningTooltipIconButton = withSpinLock(TooltipIconButton);
  return (
    <SpinningTooltipIconButton
      marketId={marketId}
      onClick={myOnClick}
      onSpinStop={onClick}
      disabled={operationRunning}
      translationId="decisionDialogsBecomeObserver"
      icon={<VisibilityIcon />}
    />
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
