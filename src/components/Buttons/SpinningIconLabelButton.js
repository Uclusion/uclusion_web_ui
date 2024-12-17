/** A simple button that when spinning is true, ignores it's children
 * for a circular progress indicator
 */
import React, { useContext } from 'react'
import PropTypes from 'prop-types';
import { CircularProgress, Button, useTheme, Tooltip } from '@material-ui/core';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { makeStyles } from '@material-ui/styles'
import { preventDefaultAndProp } from '../../utils/marketIdPathFunctions';
import { useIntl } from 'react-intl';

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
        maxHeight: '1.8rem',
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
      buttonNoMarginWhite: {
        backgroundColor: "#FFF",
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
    iconOnly = false,
    id,
    toolTipId,
    ...rest
  } = props;
  const intl = useIntl();
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const classes = useStyles();
  const theme = useTheme();
  const spinning = operationRunning === id;
  const spinningDisabled = doSpin &&
    ((allowOtherOperations && spinning)||(!allowOtherOperations && operationRunning !== false));
  function myOnClick(event) {
    if (onClick) {
      preventDefaultAndProp(event);
      if (doSpin) {
        setOperationRunning(id);
      }
      onClick(event);
    }
  }
  const myDisabled = spinningDisabled || disabled;
  const myIcon = spinningDisabled || disabled ?
    <Icon color='disabled' style={{fontSize: iconOnly ? 24 : undefined}} /> :
    <Icon style={{ fontSize: iconOnly ? 24 : undefined }} htmlColor={iconColor} />;
  const myButton = <Button
    disabled={myDisabled}
    variant="outlined"
    size="small"
    id={id}
    onClick={myOnClick}
    style={{whiteSpace: 'nowrap', width: 'fit-content', minWidth: 0}}
    startIcon={iconOnly ? undefined : myIcon}
    className={noMargin ? (whiteBackground ? classes.buttonNoMarginWhite : classes.buttonNoMargin) :
      (whiteBackground ? classes.buttonWhiteBackground : classes.button)}
    {...rest}
  >
    {iconOnly && myIcon}
    {children}
    {spinning && (
      <CircularProgress
        size={theme.typography.fontSize}
        color="inherit"
        style={{position: 'absolute', top: '50%', left: '50%', marginTop: -6, marginLeft: -12}}
      />
    )}
  </Button>;
  if (toolTipId && !myDisabled) {
    return <Tooltip title={
      <h3>
        {intl.formatMessage({ id: toolTipId })}
      </h3>
    } placement="top">
      {myButton}
    </Tooltip>
  }
  return myButton;
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
