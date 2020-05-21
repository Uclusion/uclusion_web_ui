import React from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import AddIcon from '@material-ui/icons/Add'
import ExpandableAction from '../../../components/SidebarActions/Planning/ExpandableAction'
import { ACTION_BUTTON_COLOR } from '../../../components/Buttons/ButtonConstants'

function InvestibleAddActionButton(props) {
  const { onClick } = props;
  const intl = useIntl();

  return (
    <ExpandableAction
      icon={<AddIcon htmlColor={ACTION_BUTTON_COLOR} />}
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