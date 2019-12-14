import React from 'react';
import PropTypes from 'prop-types';
import SpinBlockingSidebarAction from '../../../components/SpinBlocking/SpinBlockingSidebarAction';
import EditIcon from '@material-ui/icons/Edit';
import { useIntl } from 'react-intl';

function PlanningInvestibleEditActionButton(props) {

  const intl = useIntl();
  const label = intl.formatMessage({ id: 'investibleEditLabel' });
  const {
    onClick,
    marketId,
    disabled,
    onSpinStart,
    onSpinStop,
  } = props;

  return (
    <SpinBlockingSidebarAction
      disabled={disabled}
      marketId={marketId}
      icon={<EditIcon />}
      label={label}
      onClick={onClick}
      onSpinStart={onSpinStart}
      onSpinStop={onSpinStop}
    />
  );
}

PlanningInvestibleEditActionButton.propTypes = {
  onClick: PropTypes.func,
  marketId: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  onSpinStart: PropTypes.func,
  onSpinStop: PropTypes.func,
};

PlanningInvestibleEditActionButton.defaultProps = {
  onClick: () => {},
  disabled: false,
  onSpinStart: () => {},
  onSpinStop: () => {},
};

export default PlanningInvestibleEditActionButton;
