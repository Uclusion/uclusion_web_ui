import { withSpinLock } from './SpinBlockingHOC'
import React from 'react'
import PropTypes from 'prop-types'
import { ListItem, Tooltip } from '@material-ui/core'
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
    }
  };
});

function SpinBlockingListAction(props) {
  const {
    id,
    label,
    openLabel,
    onClick,
    customClasses,
    disabled,
  } = props;
  const myClasses = useStyles()
  const classes = customClasses || myClasses
  const SpinningListItem = withSpinLock(ListItem)

  return (
    <SpinningListItem
      key={label}
      id={id}
      button
      onClick={onClick}
      className={classes.menuItem}
      disabled={disabled}
    >
      <Tooltip title={label}>
        <div style={{fontSize: '0.8rem', paddingLeft: '8px'}}>
          {openLabel}
        </div>
      </Tooltip>
    </SpinningListItem>
  );
}

SpinBlockingListAction.propTypes = {
  icon: PropTypes.element.isRequired,
  label: PropTypes.string.isRequired,
  openLabel: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  id: PropTypes.string.isRequired,
  customClasses: PropTypes.object,
  disabled: PropTypes.bool,
};

SpinBlockingListAction.defaultProps = {
  disabled: false,
};

export default SpinBlockingListAction;
