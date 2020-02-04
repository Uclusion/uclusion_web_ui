import React from 'react';
import PropTypes from 'prop-types';
import SpinBlockingSidebarAction from '../../../components/SpinBlocking/SpinBlockingSidebarAction';
import EditIcon from '@material-ui/icons/Edit';
import { useIntl } from 'react-intl';

function PlanningInvestibleEditActionButton(props) {

  const intl = useIntl();
  const {
    onClick,
    marketId,
    disabled,
    onSpinStart,
    onSpinStop,
    isInNotDoing,
  } = props;
  const labelId = isInNotDoing ? 'investibleAssignForVotingLabel' : 'investibleEditLabel';
  const label = intl.formatMessage({ id: labelId});
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
  isInNotDoing: PropTypes.bool,
  disabled: PropTypes.bool,
  onSpinStart: PropTypes.func,
  onSpinStop: PropTypes.func,
};

PlanningInvestibleEditActionButton.defaultProps = {
  onClick: () => {},
  disabled: false,
  isInNotDoing: false,
  onSpinStart: () => {},
  onSpinStop: () => {},
};

export default PlanningInvestibleEditActionButton;
