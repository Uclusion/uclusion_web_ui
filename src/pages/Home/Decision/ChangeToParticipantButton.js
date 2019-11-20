import React from 'react';
import PropTypes from 'prop-types';
import { changeToParticipant } from '../../../api/markets';
import ThumbsUpDownIcon from '@material-ui/icons/ThumbsUpDown';
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton';


function ChangeToParticipantButton(props) {
  const { marketId, onClick } = props;

  function myOnClick() {
    return changeToParticipant(marketId)
      .then(() => onClick());
  }

  return (
    <TooltipIconButton
      translationId="decisionDialogsBecomeParticipant"
      icon={<ThumbsUpDownIcon />}
      onClick={myOnClick}
    />
  );
}

ChangeToParticipantButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

ChangeToParticipantButton.defaultProps = {
  onClick: () => {},
};

export default ChangeToParticipantButton;
