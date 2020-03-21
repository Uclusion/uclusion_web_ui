import React from 'react';
import PropTypes from 'prop-types';
import ExpandableSidebarAction from '../../../components/SidebarActions/ExpandableSidebarAction';
import { useIntl } from 'react-intl';
import AddIcon from '@material-ui/icons/Add';

function InvestibleAddActionButton(props) {
  const { onClick } = props;
  const intl = useIntl();

  return (
    <ExpandableSidebarAction
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