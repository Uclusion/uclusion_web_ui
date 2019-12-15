import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import ArchiveIcon from '@material-ui/icons/Archive';
import { archiveMarket } from '../../../api/markets';
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext';
import { withSpinLock } from '../../../components/SpinBlocking/SpinBlockingHOC';

function ArchiveMarketButton(props) {
  const [operationRunning] = useContext(OperationInProgressContext);
  const {
    marketId,
    onClick,
  } = props;

  function myOnClick() {
    return archiveMarket(marketId);
  }

  const SpinningTooltipIconButton = withSpinLock(TooltipIconButton);

  return (
    <SpinningTooltipIconButton
      marketId={marketId}
      onClick={myOnClick}
      onSpinStop={onClick}
      disabled={operationRunning}
      translationId="decisionDialogsArchiveDialog"
      icon={<ArchiveIcon />}
    />
  );
}

ArchiveMarketButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

ArchiveMarketButton.defaultProps = {
  onClick: () => {
  },
};

export default ArchiveMarketButton;
