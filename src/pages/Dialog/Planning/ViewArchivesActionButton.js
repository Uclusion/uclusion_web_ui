import React from 'react';
import PropTypes from 'prop-types';
import ExpandableSidebarAction from '../../../components/SidebarActions/ExpandableSidebarAction';
import { useIntl } from 'react-intl';
import MenuBookIcon from '@material-ui/icons/MenuBook';

function ViewArchiveActionButton(props) {

  const { onClick } = props;
  const intl = useIntl();

  return (
    <ExpandableSidebarAction
      icon={<MenuBookIcon />}
      label={intl.formatMessage({ id: 'planningDialogViewArchivesLabel'})}
      onClick={onClick}/>
  );
}

ViewArchiveActionButton.propTypes = {
  onClick: PropTypes.func,
};

ViewArchiveActionButton.defaultProps = {
  onClick: () => {
  },
};

export default ViewArchiveActionButton;


