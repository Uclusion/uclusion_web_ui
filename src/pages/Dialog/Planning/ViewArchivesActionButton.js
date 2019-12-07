import React from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router';
import { useIntl } from 'react-intl';
import MenuBookIcon from '@material-ui/icons/MenuBook';
import ExpandableSidebarAction from '../../../components/SidebarActions/ExpandableSidebarAction';
import { formMarketArchivesLink, navigate } from '../../../utils/marketIdPathFunctions';

function ViewArchiveActionButton(props) {

  const intl = useIntl();
  const { marketId } = props;
  const history = useHistory();

  function onClick(){
    navigate(history, formMarketArchivesLink(marketId));
  }


  return (
    <ExpandableSidebarAction
      icon={<MenuBookIcon />}
      label={intl.formatMessage({ id: 'planningDialogViewArchivesLabel'})}
      onClick={onClick}/>
  );
}

ViewArchiveActionButton.propTypes = {
  marketId: PropTypes.string.isRequired,
};

export default ViewArchiveActionButton;


