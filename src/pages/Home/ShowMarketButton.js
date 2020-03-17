import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { EMPTY_SPIN_RESULT } from '../../constants/global';
import { showMarket } from '../../api/markets';
import SpinningTooltipIconButton from '../../components/SpinBlocking/SpinningTooltipIconButton';
import LaunchIcon from '@material-ui/icons/Launch';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { changeMarketHidden } from '../../contexts/MarketPresencesContext/marketPresencesHelper';

function ShowMarketButton(props) {
  const {
    marketId,
    onClick,
  } = props;

  const [mpState, mpDispatch] = useContext(MarketPresencesContext);

  function myOnClick() {
    return showMarket(marketId)
      .then(() => {
        changeMarketHidden(mpState, mpDispatch, marketId, false);
        return EMPTY_SPIN_RESULT;
      })
  }

  return (
    <SpinningTooltipIconButton
      marketId={marketId}
      onClick={myOnClick}
      onSpinStop={onClick}
      key="enter"
      hasSpinChecker
      translationId="decisionDialogsRestoreDialog"
      icon={<LaunchIcon />}
    />
  );
}

ShowMarketButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

ShowMarketButton.defaultProps = {
  onClick: () => {},
};

export default ShowMarketButton;
