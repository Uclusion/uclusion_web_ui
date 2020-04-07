import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { changeUserToObserver } from '../../api/markets'
import ArchiveIcon from '@material-ui/icons/Archive'
import SpinningTooltipIconButton from '../../components/SpinBlocking/SpinningTooltipIconButton'
import { changeObserverStatus } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { EMPTY_SPIN_RESULT } from '../../constants/global'

function ChangeToObserverButton(props) {
  const { marketId, onClick } = props;
  const [mpState, mpDispatch] = useContext(MarketPresencesContext);

  function myOnClick() {
    return changeUserToObserver(marketId)
      .then(() => {
        changeObserverStatus(mpState, mpDispatch, marketId, true);
        return EMPTY_SPIN_RESULT;
      });
  }

  return (
    <SpinningTooltipIconButton
      marketId={marketId}
      onClick={myOnClick}
      onSpinStop={onClick}
      key="subscribe"
      translationId="decisionDialogsBecomeObserver"
      icon={<ArchiveIcon />}
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
