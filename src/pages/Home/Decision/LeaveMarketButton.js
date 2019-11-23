import React from 'react';
import PropTypes from 'prop-types';
import { leaveMarket } from '../../../api/markets';
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';

function LeaveMarketButton(props) {

  const {
    onClick,
    marketId,
  } = props;

  function myOnClick() {
    return leaveMarket(marketId)
      .then(() => {
        return onClick();
      });
  }

  return (
    <TooltipIconButton
      key="exit"
      translationId="decisionDialogsExitDialog"
      icon={<ExitToAppIcon />}
      onClick={myOnClick}
    />
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