import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import { changeToObserver } from '../../../api/markets';
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton';


function ChangeToObserverButton(props) {
  const { marketId, onClick, translationId } = props;
  const intl = useIntl();

  function myOnClick() {
    return changeToObserver(marketId);
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
};

ChangeToObserverButton.defaultProps = {
  onClick: () => {
  },
  translationId: 'decisionDialogsBecomeObserver',
};

export default ChangeToObserverButton;
