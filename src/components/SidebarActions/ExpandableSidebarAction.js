import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import {
  ListItem, ListItemIcon, ListItemText, Tooltip,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import { SidebarContext } from '../../contexts/SidebarContext';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';

export const useStyles = makeStyles((theme) => {
  return {
    menuItem: {
      paddingTop: '19px',
      paddingBottom: '19px',
      '&:first-child': {
        paddingTop: '40px',
      },
      '&:last-child': {
        paddingBottom: '52px',
      },
    },
    menuIcon: {
      display: 'flex',
      justifyContent: 'center',
      color: 'white',
      '& > .MuiSvgIcon-root': {
        width: '30px',
        height: '30px',
      },
    },
    menuTitle: {
      color: 'white',
    },
  };
});

function ExpandableSidebarAction(props) {
  const {
    icon,
    id,
    label,
    onClick,
  } = props;

  const classes = useStyles();
  const [amOpen] = useContext(SidebarContext);
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
      {amOpen && (
        <ListItemText className={classes.menuTitle}>
          {label}
        </ListItemText>
      )}
    </ListItem>
  );
}

ExpandableSidebarAction.propTypes = {
  icon: PropTypes.element.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default ExpandableSidebarAction;
