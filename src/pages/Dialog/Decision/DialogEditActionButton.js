import React from 'react';
import PropTypes from 'prop-types';
import EditIcon from '@material-ui/icons/Edit';
import { useIntl } from 'react-intl';
import ExpandableSidebarAction from '../../../components/SidebarActions/ExpandableSidebarAction';

function DialogEditActionButton(props){

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

DialogEditActionButton.propTypes = {
  onClick: PropTypes.func.isRequired,
};

export default DialogEditActionButton;