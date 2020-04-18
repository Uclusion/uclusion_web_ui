import React from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import AddIcon from '@material-ui/icons/Add'
import ExpandableAction from '../../../components/SidebarActions/Planning/ExpandableAction'

function InvestibleAddActionButton(props) {
  const { onClick } = props;
  const intl = useIntl();

  return (
    <ExpandableAction
      icon={<AddIcon />}
      label={intl.formatMessage({ id: 'planningDialogAddInvestibleExplanation' })}
      openLabel={intl.formatMessage({ id: 'planningDialogAddInvestibleLabel' })}
      onClick={onClick}
    />
  );
}

InvestibleAddActionButton.propTypes = {
  onClick: PropTypes.func,
};

InvestibleAddActionButton.defaultProps = {
  onClick: () => {},
};

export default InvestibleAddActionButton;