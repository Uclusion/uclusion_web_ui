import React from 'react';
import PropTypes from 'prop-types';
import ExpandableSidebarAction from '../../components/SidebarActions/ExpandableSidebarAction';
import { useIntl } from 'react-intl';
import { getDialogTypeIcon } from '../../components/Dialogs/dialogIconFunctions';
import { PLANNING_TYPE } from '../../constants/markets';


function PlanningAddActionButton(props) {

  const { onClick } = props;

  const intl = useIntl();
  const label = intl.formatMessage({ id: 'homeAddPlanning' });

  return (
    <ExpandableSidebarAction
      icon={getDialogTypeIcon(PLANNING_TYPE)}
      label={label}
      onClick={onClick}
    />
  );
}

PlanningAddActionButton.propTypes = {
  onClick: PropTypes.func,
};

PlanningAddActionButton.defaultProps = {
  onClick: () => {},
};

export default PlanningAddActionButton;