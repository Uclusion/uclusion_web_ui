import React, { useContext } from 'react';
import { EMPTY_SPIN_RESULT } from '../../constants/global';
import PropTypes from 'prop-types';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import { hideMarket } from '../../api/markets';
import SpinningTooltipIconButton from '../../components/SpinBlocking/SpinningTooltipIconButton';
import { changeMarketHidden } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';

function HideMarketButton(props) {
  const {
    onClick,
    marketId,
  } = props;

  const [mpState, mpDispatch] = useContext(MarketPresencesContext);

  function myOnClick() {
    return hideMarket(marketId)
      .then(() => {
        changeMarketHidden(mpState, mpDispatch, marketId, true);
        return EMPTY_SPIN_RESULT;
      });
  }

  return (
    <SpinningTooltipIconButton
      marketId={marketId}
      onClick={myOnClick}
      onSpinStop={onClick}
      key="exit"
      hasSpinChecker
      translationId="decisionDialogsDismissDialog"
      icon={<ExitToAppIcon />}
    />
  );
}

HideMarketButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

HideMarketButton.defaultProps = {
  onClick: () => {
  },
};

export default HideMarketButton;
