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
      '& > .MuiSvgIcon-root': {
        width: '30px',
        height: '30px',
      },
    },
    menuTitleWhite: {
      flex: 3,
      color: 'white',
      fontWeight: 700
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
    tipPlacement = 'bottom',
    useWhiteText
  } = props;

  const classes = useStyles();
  const [operationRunning] = useContext(OperationInProgressContext);

  function myOnClick() {
    onClick();
  }

  return (
    <Tooltip title={toolTip || label} placement={tipPlacement}>
      <ListItem
        id={id}
        className={classes.menuItem}
        key={label}
        button
        disabled={operationRunning}
        onClick={myOnClick}
      >
        {openLabel && (
          <ListItemText className={useWhiteText ? classes.menuTitleWhite : classes.menuTitle}>
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
  tipPlacement: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  toolTip: PropTypes.string,
  useWhiteText: PropTypes.bool
};

ExpandableAction.defaultProps = {
  useWhiteText: false,
};

export default ExpandableAction;
