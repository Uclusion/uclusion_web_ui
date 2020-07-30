import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { ListItem, ListItemIcon, ListItemText, Tooltip, } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'

export const useStyles = makeStyles((theme) => {
  return {
    menuItem: {
      display: 'flex',
      flexDirection:'row'
    },
    menuIcon: {
      flex: 1,
      display: 'flex',
      justifyContent: 'flex-end',
      color: '#bdbdbd',
      '& > .MuiSvgIcon-root': {
        width: '30px',
        height: '30px',
      },
    },
    menuTitle: {
      flex: 3,
      color: 'black',
      fontWeight: 700
    },
  };
});

function ExpandableAction(props) {
  const {
    icon,
    id,
    label,
    toolTip,
    openLabel,
    onClick,
  } = props;

  const classes = useStyles();
  const [operationRunning] = useContext(OperationInProgressContext);

  function myOnClick() {
    onClick();
  }

  return (
    <Tooltip title={toolTip || label}>
      <ListItem
        id={id}
        className={classes.menuItem}
        key={label}
        button
        disabled={operationRunning}
        onClick={myOnClick}
      >
        {openLabel && (
          <ListItemText className={classes.menuTitle}>
            {openLabel}
          </ListItemText>
        )}
        <ListItemIcon className={classes.menuIcon}>
          {icon}
        </ListItemIcon>
      </ListItem>
    </Tooltip>
  );
}

ExpandableAction.propTypes = {
  icon: PropTypes.element.isRequired,
  label: PropTypes.string.isRequired,
  openLabel: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  toolTip: PropTypes.string,
};

export default ExpandableAction;
