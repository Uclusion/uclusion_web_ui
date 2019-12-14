import { withSpinLock } from './SpinBlockingHOC';
import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import {
  ListItem, ListItemIcon, ListItemText, Tooltip,
} from '@material-ui/core';
import { SidebarContext } from '../../contexts/SidebarContext';


function SpinBlockingSidebarAction(props) {
  const {
    marketId,
    icon,
    label,
    onClick,
    onSpinStart,
    onSpinStop,
  } = props;

  const [amOpen] = useContext(SidebarContext);


  const SpinningListItem = withSpinLock(ListItem);

  return (
    <SpinningListItem
      key={label}
      button
      marketId={marketId}
      onClick={onClick}
      onSpinStart={onSpinStart}
      onSpinStop={onSpinStop}
    >
      <Tooltip title={label}>
        <ListItemIcon>
          {icon}
        </ListItemIcon>
      </Tooltip>
      {amOpen && (
        <ListItemText>
          {label}
        </ListItemText>
      )}
    </SpinningListItem>
  );
}

SpinBlockingSidebarAction.propTypes = {
  marketId: PropTypes.string.isRequired,
  icon: PropTypes.element.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  onSpinStart: PropTypes.func,
  onSpinStop: PropTypes.func,
};

SpinBlockingSidebarAction.defaultProps = {
  onSpinStart: () => {},
  onSpinStop: () => {},
};

export default SpinBlockingSidebarAction;
