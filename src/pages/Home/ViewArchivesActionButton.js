import React from 'react';
import { useHistory } from 'react-router';
import { useIntl } from 'react-intl';
import MenuBookIcon from '@material-ui/icons/MenuBook';
import ExpandableSidebarAction from '../../components/SidebarActions/ExpandableSidebarAction';
import { navigate } from '../../utils/marketIdPathFunctions';

function ViewArchiveActionButton(props) {

  const intl = useIntl();
  const history = useHistory();

  function onClick() {
    navigate(history, '/archives');
  }

  return (
    <ExpandableSidebarAction
      icon={<MenuBookIcon/>}
      label={intl.formatMessage({ id: 'homeViewArchives' })}
      onClick={onClick}/>
  );
}

export default ViewArchiveActionButton;


