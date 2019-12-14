import React from 'react';
import PropTypes from 'prop-types';
import EditIcon from '@material-ui/icons/Edit';
import { useIntl } from 'react-intl';
import SpinBlockingSidebarAction from '../../../components/SpinBlocking/SpinBlockingSidebarAction';

function DialogEditActionButton(props){

  const { onClick, marketId } = props;
  const intl = useIntl();

  return (
    <SpinBlockingSidebarAction
      icon={<EditIcon />}
      marketId={marketId}
      label={intl.formatMessage({ id: 'dialogEditButtonTooltip' })}
      onClick={onClick}
    />
  );
}

DialogEditActionButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  marketId: PropTypes.string.isRequired,
};

export default DialogEditActionButton;