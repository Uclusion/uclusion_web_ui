import React from 'react';
import PropTypes from 'prop-types';
import ThumbsUpDownIcon from '@material-ui/icons/ThumbsUpDown';
import { changeToParticipant } from '../../api/markets';
import SpinBlockingSidebarAction from '../../components/SpinBlocking/SpinBlockingSidebarAction';
import { useIntl } from 'react-intl';


function ChangeToParticipantActionButton(props) {
  const { marketId, onClick } = props;

  function myOnClick() {
    return changeToParticipant(marketId)
      .then(() => onClick());
  }
  const intl = useIntl();
  const label = intl.formatMessage({ id: 'decisionDialogsBecomeParticipant' });
  return (
    <SpinBlockingSidebarAction
      marketId={marketId}
      onClick={myOnClick}
      label={label}
      icon={<ThumbsUpDownIcon />}
    />
  );
}

ChangeToParticipantActionButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

ChangeToParticipantActionButton.defaultProps = {
  onClick: () => {},
};

export default ChangeToParticipantActionButton;
