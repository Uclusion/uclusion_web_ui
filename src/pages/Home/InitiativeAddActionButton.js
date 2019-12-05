import React from 'react';
import PropTypes from 'prop-types';
import ExpandableSidebarAction from '../../components/SidebarActions/ExpandableSidebarAction';
import { useIntl } from 'react-intl';
import { getDialogTypeIcon } from '../../components/Dialogs/dialogIconFunctions';
import { INITIATIVE_TYPE } from '../../constants/markets';


function InitiativeAddActionButton(props) {

  const { onClick } = props;

  const intl = useIntl();
  const label = intl.formatMessage({ id: 'homeAddInitiative' });

  return (
    <ExpandableSidebarAction
      icon={getDialogTypeIcon(INITIATIVE_TYPE)}
      label={label}
      onClick={onClick}
    />
  );
}

InitiativeAddActionButton.propTypes = {
  onClick: PropTypes.func,
};

InitiativeAddActionButton.defaultProps = {
  onClick: () => {},
};

export default InitiativeAddActionButton;