import React from 'react'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router'
import { useIntl } from 'react-intl'
import MenuBookIcon from '@material-ui/icons/MenuBook'
import { formMarketArchivesLink, navigate } from '../../../utils/marketIdPathFunctions'
import ExpandableAction from '../../../components/SidebarActions/Planning/ExpandableAction'
import { ACTION_BUTTON_COLOR } from '../../../components/Buttons/ButtonConstants'
import { makeStyles } from '@material-ui/core'

const useStyles = makeStyles(
  () => ({
    grey: {
      backgroundColor: '#e0e0e0',
    },
  }),
  { name: "InvestibleAdd" }
);

function ViewArchiveActionButton(props) {

  const intl = useIntl();
  const { marketId } = props;
  const history = useHistory();
  const classes = useStyles();

  function onClick(){
    navigate(history, formMarketArchivesLink(marketId));
  }


  return (
    <div className={classes.grey}>
      <ExpandableAction
        icon={<MenuBookIcon htmlColor={ACTION_BUTTON_COLOR} />}
        label={intl.formatMessage({ id: 'planningDialogViewArchivesExplanation'})}
        openLabel={intl.formatMessage({ id: 'planningDialogViewArchivesLabel'})}
        onClick={onClick}/>
    </div>
  );
}

ViewArchiveActionButton.propTypes = {
  marketId: PropTypes.string.isRequired,
};

export default ViewArchiveActionButton;


