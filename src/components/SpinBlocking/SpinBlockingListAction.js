import { withSpinLock } from './SpinBlockingHOC'
import React from 'react'
import PropTypes from 'prop-types'
import { ListItem, ListItemIcon, ListItemText, Tooltip, useMediaQuery, useTheme, } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'

const useStyles = makeStyles(() => {
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
    }
  };
});

function SpinBlockingListAction(props) {
  const {
    marketId,
    id,
    icon,
    label,
    openLabel,
    highlighted,
    onClick,
    onSpinStart,
    onSpinStop,
    hasSpinChecker,
    customClasses,
    disabled,
  } = props;
  const theme = useTheme()
  const mobileLayout = useMediaQuery(theme.breakpoints.down('md'))
  const myClasses = useStyles()
  const classes = customClasses || myClasses
  const SpinningListItem = withSpinLock(ListItem)

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
      disabled={disabled}
    >
      {!mobileLayout && (
        <Tooltip title={label}>
          <ListItemIcon className={classes.menuIcon}>
            {icon}
          </ListItemIcon>
        </Tooltip>
      )}
      <Tooltip title={label}>
        <ListItemText primaryTypographyProps={{ color: highlighted ? 'error' : undefined }} primary={openLabel} />
      </Tooltip>
    </SpinningListItem>
  );
}

SpinBlockingListAction.propTypes = {
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
  disabled: PropTypes.bool,
};

SpinBlockingListAction.defaultProps = {
  onSpinStart: () => {},
  onSpinStop: () => {},
  hasSpinChecker: false,
  id: undefined,
  disabled: false,
};

export default SpinBlockingListAction;
