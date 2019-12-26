import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import SpinBlockingSidebarAction from '../../components/SpinBlocking/SpinBlockingSidebarAction';
import { changeToObserver } from '../../api/markets';
import VisibilityIcon from '@material-ui/icons/Visibility';

function ChangeToObserverActionButton(props) {
  const { onClick, marketId } = props;

  function myOnClick() {
    return changeToObserver(marketId)
      .then(() => onClick());
  }

  const intl = useIntl();
  const label = intl.formatMessage({ id: 'decisionDialogsBecomeObserver' });

  return (
    <SpinBlockingSidebarAction
      marketId={marketId}
      icon={<VisibilityIcon />}
      label={label}
      onClick={myOnClick}
    />
  );
}

ChangeToObserverActionButton.propTypes = {
  onClick: PropTypes.func,
  marketId: PropTypes.string.isRequired,
};

ChangeToObserverActionButton.defaultProps = {
  onClick: () => {},
};

export default ChangeToObserverActionButton;
