import React from 'react';
import { useIntl } from 'react-intl';

import PropTypes from 'prop-types';
import { changeUserToParticipant } from '../../../api/markets';
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton';


function ChangeToParticipantButton(props) {
  const { marketId, onClick, translationId, userId } = props;
  const intl = useIntl();

  function myOnClick() {
    return changeUserToParticipant(marketId, userId);
  }

  return (
    <SpinBlockingButton
      marketId={marketId}
      onClick={myOnClick}
      onSpinStop={onClick}
      variant="contained"
      color="primary"
      size="small"
    >
      {intl.formatMessage({ id: translationId })}
    </SpinBlockingButton>
  );
}

ChangeToParticipantButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  translationId: PropTypes.string,
  userId: PropTypes.string,
};

ChangeToParticipantButton.defaultProps = {
  onClick: () => {},
  translationId: 'decisionDialogsBecomeParticipant',
  userId: undefined,
};

export default ChangeToParticipantButton;
