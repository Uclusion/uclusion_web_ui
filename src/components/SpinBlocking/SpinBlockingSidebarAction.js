import { withSpinLock } from './SpinBlockingHOC'
import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { ListItem, ListItemIcon, ListItemText, Tooltip, } from '@material-ui/core'
import { SidebarContext } from '../../contexts/SidebarContext'
import { useStyles } from '../SidebarActions/ExpandableSidebarAction'

function SpinBlockingSidebarAction(props) {
  const {
    marketId,
    id,
    icon,
    label,
    openLabel,
    onClick,
    onSpinStart,
    onSpinStop,
    hasSpinChecker,
    customClasses,
    isOpen,
    disabled,
  } = props;
  const myClasses = useStyles();
  const classes = customClasses || myClasses;
  const [amOpen] = useContext(SidebarContext);


  const SpinningListItem = withSpinLock(ListItem);

  return (
    <SpinningListItem
      key={label}
      id={id}
      button
      marketId={marketId}
      onClick={onClick}
      onSpinStart={onSpinStart}
      onSpinStop={onSpinStop}
      className={classes.menuItem}
      hasSpinChecker={hasSpinChecker}
      spanChildren={false}
      disabled={disabled}
    >
      <Tooltip title={label}>
        <ListItemIcon className={classes.menuIcon}>
          {icon}
        </ListItemIcon>
      </Tooltip>
      {(isOpen !== undefined ? isOpen : amOpen) && (
        <ListItemText className={classes.menuTitle}>
          {openLabel}
        </ListItemText>
      )}
    </SpinningListItem>
  );
}

SpinBlockingSidebarAction.propTypes = {
  marketId: PropTypes.string.isRequired,
  icon: PropTypes.element.isRequired,
  label: PropTypes.string.isRequired,
  openLabel: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  hasSpinChecker: PropTypes.bool,
  onSpinStart: PropTypes.func,
  onSpinStop: PropTypes.func,
  id: PropTypes.string,
  customClasses: PropTypes.object,
  isOpen: PropTypes.bool,
  disabled: PropTypes.bool,
};

SpinBlockingSidebarAction.defaultProps = {
  onSpinStart: () => {},
  onSpinStop: () => {},
  hasSpinChecker: false,
  id: undefined,
  isOpen: undefined,
  disabled: false,
};

export default SpinBlockingSidebarAction;
