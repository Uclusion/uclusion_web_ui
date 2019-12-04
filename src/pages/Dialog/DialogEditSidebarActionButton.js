import React from 'react';
import PropTypes from 'prop-types';
import EditIcon from '@material-ui/icons/Edit';
import { useIntl } from 'react-intl';
import ExpandableSidebarAction from '../../components/SidebarActions/ExpandableSidebarAction';

function DialogEditSidebarActionButton(props){

  const { onClick } = props;
  const intl = useIntl();

  return (
    <ExpandableSidebarAction
      icon={<EditIcon />}
      label={intl.formatMessage({ id: 'dialogEditButtonTooltip' })}
      onClick={onClick}
    />
  );
}

DialogEditSidebarActionButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export default DialogEditSidebarActionButton;