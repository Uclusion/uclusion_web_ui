import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import GroupAddIcon from '@material-ui/icons/GroupAdd';
import ExpandableSidebarAction from '../../components/SidebarActions/ExpandableSidebarAction';

function AddParticipantsActionButton(props) {
  const { onClick } = props;

  const intl = useIntl();
  const label = intl.formatMessage({ id: 'dialogAddParticipantsLabel' });

  return (
    <ExpandableSidebarAction
      icon={<GroupAddIcon />}
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
