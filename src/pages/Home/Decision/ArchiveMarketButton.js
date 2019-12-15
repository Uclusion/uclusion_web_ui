import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import ArchiveIcon from '@material-ui/icons/Archive';
import { archiveMarket } from '../../../api/markets';
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton';
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext';

function ArchiveMarketButton(props) {
  const [operationRunning] = useContext(OperationInProgressContext);
  const {
    marketId,
    onClick,
  } = props;

  function myOnClick() {
    return archiveMarket(marketId);
  }

  return (
    <SpinBlockingButton
      marketId={marketId}
      onClick={myOnClick}
      onSpinStop={onClick}
    >
      <TooltipIconButton
        disabled={operationRunning}
        translationId="decisionDialogsArchiveDialog"
        icon={<ArchiveIcon />}
      />
    </SpinBlockingButton>
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
