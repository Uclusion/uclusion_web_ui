import React from 'react';
import PropTypes from 'prop-types';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import { leaveMarket } from '../../../api/markets';
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton';
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton';

function LeaveMarketButton(props) {
  const {
    onClick,
    marketId,
  } = props;

  function myOnClick() {
    return leaveMarket(marketId);
  }

  return (
    <SpinBlockingButton
      marketId={marketId}
      onClick={myOnClick}
      onSpinStop={onClick}
    >
      <TooltipIconButton
        key="exit"
        translationId="decisionDialogsExitDialog"
        icon={<ExitToAppIcon />}
      />
    </SpinBlockingButton>
  );
}

LeaveMarketButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

LeaveMarketButton.defaultProps = {
  onClick: () => {
  },
};

export default LeaveMarketButton;
