import React from 'react'
import PropTypes from 'prop-types'
import { ListItem, Tooltip, } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'

const useStyles = makeStyles(() => {
  return {
    menuItem: {
      padding: 0,
      display: 'flex',
      flexDirection:'row',
      width: 'unset'
    },
    menuIcon: {
      display: 'flex',
      justifyContent: 'flex-end',
      '& > .MuiSvgIcon-root': {
        width: '30px',
        height: '30px',
      },
    },
    menuTitleWhite: {
      color: 'white',
      whiteSpace: 'nowrap',
      paddingRight: '0.5rem'
    },
    menuTitle: {
      color: 'black',
      whiteSpace: 'nowrap',
      paddingRight: '0.5rem'
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
    useWhiteText = false,
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
          <div className={useWhiteText ? classes.menuTitleWhite : classes.menuTitle}>
            {openLabel}
          </div>
        )}
        <div className={classes.menuIcon}>
          {icon}
        </div>
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

export default ExpandableAction;
