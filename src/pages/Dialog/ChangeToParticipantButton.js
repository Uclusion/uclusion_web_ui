import React, { useContext } from 'react'
import UnarchiveIcon from '@material-ui/icons/Unarchive'
import PropTypes from 'prop-types'
import { changeUserToParticipant } from '../../api/markets'
import SpinningTooltipIconButton from '../../components/SpinBlocking/SpinningTooltipIconButton'
import { changeObserverStatus } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { EMPTY_SPIN_RESULT } from '../../constants/global'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { ACTION_BUTTON_COLOR } from '../../components/Buttons/ButtonConstants'

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
      icon={<UnarchiveIcon htmlColor={ACTION_BUTTON_COLOR} />}
    />
  );
}

ChangeToParticipantButton.propTypes = {
  marketId: PropTypes.string.isRequired,
};

export default ChangeToParticipantButton;
