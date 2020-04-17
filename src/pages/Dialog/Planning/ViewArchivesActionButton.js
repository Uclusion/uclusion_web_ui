import React from 'react'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router'
import { useIntl } from 'react-intl'
import MenuBookIcon from '@material-ui/icons/MenuBook'
import { formMarketArchivesLink, navigate } from '../../../utils/marketIdPathFunctions'
import ExpandableAction from '../../../components/SidebarActions/Planning/ExpandableAction'

function ViewArchiveActionButton(props) {

  const intl = useIntl();
  const { marketId } = props;
  const history = useHistory();

  function onClick(){
    navigate(history, formMarketArchivesLink(marketId));
  }


  return (
    <ExpandableAction
      icon={<MenuBookIcon />}
      label={intl.formatMessage({ id: 'planningDialogViewArchivesExplanation'})}
      openLabel={intl.formatMessage({ id: 'planningDialogViewArchivesLabel'})}
      onClick={onClick}/>
  );
}

ViewArchiveActionButton.propTypes = {
  marketId: PropTypes.string.isRequired,
};

export default ViewArchiveActionButton;


