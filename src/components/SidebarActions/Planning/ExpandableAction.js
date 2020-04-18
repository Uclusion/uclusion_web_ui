import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { ListItem, ListItemIcon, ListItemText, Tooltip, } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'

export const useStyles = makeStyles((theme) => {
  return {
    menuItem: {
      paddingTop: '5px',
      paddingBottom: '5px',
      border: '1px solid #ccc',
    },
    menuIcon: {
      display: 'flex',
      justifyContent: 'center',
      color: 'black',
      '& > .MuiSvgIcon-root': {
        width: '30px',
        height: '30px',
      },
    },
    menuTitle: {
      color: 'black',
    },
  };
});

function ExpandableSidebarAction(props) {
  const {
    icon,
    id,
    label,
    openLabel,
    onClick,
  } = props;

  const classes = useStyles();
  const [operationRunning] = useContext(OperationInProgressContext);

  function myOnClick() {
    onClick();
  }

  return (
    <ListItem
      id={id}
      className={classes.menuItem}
      key={label}
      button
      disabled={operationRunning}
      onClick={myOnClick}
    >
      <Tooltip title={label}>
        <ListItemIcon className={classes.menuIcon}>
          {icon}
        </ListItemIcon>
      </Tooltip>
      {openLabel && (
        <ListItemText className={classes.menuTitle}>
          {openLabel}
        </ListItemText>
      )}
    </ListItem>
  );
}

ExpandableSidebarAction.propTypes = {
  icon: PropTypes.element.isRequired,
  label: PropTypes.string.isRequired,
  openLabel: PropTypes.string,
  onClick: PropTypes.func.isRequired,
};

export default ExpandableSidebarAction;
