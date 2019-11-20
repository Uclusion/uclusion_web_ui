import React from 'react';
import PropTypes from 'prop-types';
import { changeToObserver } from '../../../api/markets';
import VisibilityIcon from '@material-ui/icons/Visibility';
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton';


function ChangeToObserverButton(props) {
  const { marketId, onClick } = props;

  function myOnclick() {
    return changeToObserver(marketId)
      .then(() => onClick());
  }

  return (
    <TooltipIconButton
      translationId="decisionDialogsBecomeObserver"
      icon={<VisibilityIcon />}
      onClick={myOnclick}
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
