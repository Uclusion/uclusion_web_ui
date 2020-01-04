import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { changeUserToObserver } from '../../../api/markets';
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton';


function ChangeToObserverButton(props) {
  const { marketId, onClick, translationId, userId } = props;
  const intl = useIntl();

  function myOnClick() {
    return changeUserToObserver(marketId, userId);
  }

  return (
    <SpinBlockingButton
      marketId={marketId}
      onClick={myOnClick}
      onSpinStop={onClick}
      size="small"
      variant="contained"
      color="primary"
    >
      {intl.formatMessage({ id: translationId })}
    </SpinBlockingButton>
  );
}

ChangeToObserverButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  translationId: PropTypes.string,
  userId: PropTypes.string,
};

ChangeToObserverButton.defaultProps = {
  onClick: () => {
  },
  userId: undefined,
  translationId: 'decisionDialogsBecomeObserver',
};

export default ChangeToObserverButton;
