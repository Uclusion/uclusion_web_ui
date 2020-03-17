import React, { useContext } from 'react';
import VolumeUpIcon from '@material-ui/icons/VolumeUp';
import PropTypes from 'prop-types';
import { changeUserToParticipant } from '../../api/markets';
import SpinningTooltipIconButton from '../../components/SpinBlocking/SpinningTooltipIconButton';
import { changeObserverStatus } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { EMPTY_SPIN_RESULT } from '../../constants/global';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';

function ChangeToParticipantButton(props) {
  const { marketId } = props;
  const [mpState, mpDispatch] = useContext(MarketPresencesContext);

  function myOnClick() {
    return changeUserToParticipant(marketId)
      .then(() => {
        changeObserverStatus(mpState, mpDispatch, marketId, false);
        return EMPTY_SPIN_RESULT;
      });
  }

  return (
    <SpinningTooltipIconButton
      marketId={marketId}
      onClick={myOnClick}
      key="subscribe"
      translationId="decisionDialogsBecomeParticipant"
      icon={<VolumeUpIcon />}
    />
  );
}

ChangeToParticipantButton.propTypes = {
  marketId: PropTypes.string.isRequired,
};

export default ChangeToParticipantButton;
