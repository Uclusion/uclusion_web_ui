import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import EditAttributesIcon from '@material-ui/icons/EditAttributes';
import ExpandableSidebarAction from '../../components/SidebarActions/ExpandableSidebarAction';

function AddParticipantsActionButton(props) {
  const { onClick } = props;

  const intl = useIntl();
  const label = intl.formatMessage({ id: 'initiativeManageLabel' });

  return (
    <ExpandableSidebarAction
      icon={<EditAttributesIcon />}
      label={label}
      onClick={onClick}
    />
  );
}

AddParticipantsActionButton.propTypes = {
  onClick: PropTypes.func,
};

AddParticipantsActionButton.defaultProps = {
  onClick: () => {},
};

export default AddParticipantsActionButton;
