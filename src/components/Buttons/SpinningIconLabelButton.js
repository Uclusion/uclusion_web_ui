/** A simple button that when spinning is true, ignores it's children
 * for a circular progress indicator
 */
import React, { useContext } from 'react'
import PropTypes from 'prop-types';
import { CircularProgress, Button, useTheme } from '@material-ui/core';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { makeStyles } from '@material-ui/styles'

const useStyles = makeStyles(
  () => {
    return {
      button: {
        marginRight: '1rem',
        '& .MuiButton-label': {
          textTransform: 'none'
        },
        fontSize: '1rem',
        borderRadius: '15px',
        "&:hover": {
          backgroundColor: "#F1F1F1"
        }
      },
      buttonWhiteBackground: {
        backgroundColor: "#FFF",
        marginRight: '1rem',
        '& .MuiButton-label': {
          textTransform: 'none'
        },
        fontSize: '1rem',
        borderRadius: '15px',
        "&:hover": {
          backgroundColor: "#F1F1F1"
        }
      },
      buttonNoMargin: {
        '& .MuiButton-label': {
          textTransform: 'none'
        },
        fontSize: '1rem',
        borderRadius: '15px',
        "&:hover": {
          backgroundColor: "#F1F1F1"
        }
      },
    }
  },
  { name: "Button" }
);

function SpinningIconLabelButton(props) {
  const {
    disabled,
    doSpin,
    children,
    icon: Icon,
    noMargin,
    onClick,
    allowOtherOperations,
    whiteBackground,
    iconColor='black',
    id,
    ...rest
  } = props;
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const classes = useStyles();
  const theme = useTheme();
  const spinning = operationRunning === id;
  const spinningDisabled = doSpin &&
    ((allowOtherOperations && spinning)||(!allowOtherOperations && operationRunning !== false));
  function myOnClick(event) {
    if (onClick) {
      if (doSpin) {
        setOperationRunning(id);
      }
      onClick(event);
    }
  }
  return (
    <Button
      disabled={spinningDisabled || disabled}
      variant="outlined"
      size="small"
      id={id}
      onClick={myOnClick}
      style={{whiteSpace: 'nowrap', width: 'fit-content', minWidth: 0}}
      startIcon={spinningDisabled || disabled ? <Icon color='disabled' /> : <Icon htmlColor={iconColor} />}
      className={noMargin ? classes.buttonNoMargin: whiteBackground ? classes.buttonWhiteBackground : classes.button}
      {...rest}
    >
      {children}
      {spinning && (
        <CircularProgress
          size={theme.typography.fontSize}
          color="inherit"
          style={{position: 'absolute', top: '50%', left: '50%', marginTop: -6, marginLeft: -12}}
        />
      )}
    </Button>
  );
}

SpinningIconLabelButton.propTypes = {
  disabled: PropTypes.bool,
  doSpin: PropTypes.bool,
  allowOtherOperations: PropTypes.bool,
  icon: PropTypes.object.isRequired
};

SpinningIconLabelButton.defaultProps = {
  disabled: false,
  allowOtherOperations: false,
  doSpin: true
};

export default SpinningIconLabelButton;
