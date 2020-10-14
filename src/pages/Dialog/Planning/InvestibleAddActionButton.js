import React from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import AddIcon from '@material-ui/icons/Add'
import ExpandableAction from '../../../components/SidebarActions/Planning/ExpandableAction'
import { makeStyles } from '@material-ui/core'

const useStyles = makeStyles(
  () => ({
    blue: {
      backgroundColor: '#2d9cdb',
    },
  }),
  { name: "InvestibleAdd" }
);

function InvestibleAddActionButton(props) {
  const { onClick } = props;
  const intl = useIntl();
  const classes = useStyles();

  return (
    <div className={classes.blue}>
      <ExpandableAction
        icon={<AddIcon />}
        label={intl.formatMessage({ id: 'planningDialogAddInvestibleExplanation' })}
        openLabel={intl.formatMessage({ id: 'planningDialogAddInvestibleLabel' })}
        onClick={onClick}
      />
    </div>
  );
}

InvestibleAddActionButton.propTypes = {
  onClick: PropTypes.func,
};

InvestibleAddActionButton.defaultProps = {
  onClick: () => {},
};

export default InvestibleAddActionButton;