import React from 'react'
import PropTypes from 'prop-types'
import { ListItem, ListItemIcon, ListItemText, Tooltip, } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'

export const useStyles = makeStyles(() => {
  return {
    menuItem: {
      display: 'flex',
      flexDirection:'row',
      width: 'unset'
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
      color: 'white',
      fontWeight: 700,
      whiteSpace: 'nowrap'
    },
    menuTitle: {
      color: 'black',
      fontWeight: 700,
      whiteSpace: 'nowrap'
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
    useWhiteText,
    disabled
  } = props;

  const classes = useStyles();

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
        disabled={disabled}
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
