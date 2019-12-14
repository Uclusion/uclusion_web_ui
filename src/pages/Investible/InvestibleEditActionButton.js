import React from 'react';
import PropTypes from 'prop-types';
import ExpandableSidebarAction from '../../components/SidebarActions/ExpandableSidebarAction';
import EditIcon from '@material-ui/icons/Edit';
import { useIntl } from 'react-intl';

function InvestbileEditActionButton(props) {

  const intl = useIntl();
  const label = intl.formatMessage({ id: 'investibleEditLabel' });
  const { onClick } = props;

  return (
    <ExpandableSidebarAction
      icon={<EditIcon />}
      label={label}
      onClick={onClick}
    />
  );
}

InvestbileEditActionButton.propTypes = {
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
};

InvestbileEditActionButton.defaultProps = {
  onClick: () => {},
  disabled: false,
};

export default InvestbileEditActionButton;
