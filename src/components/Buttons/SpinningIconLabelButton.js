/** A simple button that when spinning is true, ignores it's children
 * for a circular progress indicator
 */
import React, { useContext } from 'react'
import PropTypes from 'prop-types';
import { CircularProgress, useTheme, Tooltip, Button } from '@material-ui/core';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { makeStyles } from '@material-ui/styles'
import { preventDefaultAndProp } from '../../utils/marketIdPathFunctions';
import { useIntl } from 'react-intl';
import FocusRippleButton from './FocusRippleButton';

// Shared pill geometry + motion (T-all-2171 / Q-all-119 option O-1).
// borderRadius 999px makes every button a true pill at any height, so the
// corner reads identically regardless of size (the old fixed 15px did not).
// The hover lift + active press give the tactile feedback the button lacked.
const pillBase = {
  marginRight: '1rem',
  // The comment/bug action row is a flex container with the default
  // align-items: stretch, so buttons stretch to the tallest sibling. On a bug
  // that's the taller severity dropdown / checkbox, which made the buttons
  // taller (un-tight) than on a task. align-self: center keeps each button at
  // its natural tight height regardless of the row.
  alignSelf: 'center',
  '& .MuiButton-label': {
    textTransform: 'none'
  },
  fontSize: '0.9rem',
  padding: '2px 12px',
  borderRadius: '999px',
  color: 'black',
  transition: 'box-shadow .15s ease, transform .06s ease, background-color .15s ease, border-color .15s ease',
  // Tighten the icon-to-label gap so the pill hugs its content (S-1 "tight").
  '& .MuiButton-startIcon': {
    marginRight: '4px',
    marginLeft: '-2px',
  },
  '&:active': {
    transform: 'translateY(1px) scale(0.985)',
  },
};

// Default outlined pill. Background is transparent so the button matches
// whatever surface it sits on (Q-all-121, "Match the current background"):
// white in light mode, the #C7CBCA paper card in dark mode, and consistent
// with the checkbox / wizard buttons nearby. Flat at rest (border only, like
// the surrounding controls); the hover tint + press dip give the click feel.
const outlinedPill = {
  ...pillBase,
  backgroundColor: 'transparent',
  border: '1px solid rgba(0, 0, 0, 0.23)',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    boxShadow: '0 2px 6px rgba(16, 40, 40, 0.14)',
  },
  '&:active': {
    transform: 'translateY(1px) scale(0.985)',
    boxShadow: 'none',
  },
};

// Explicit white pill for the whiteBackground variant, used where the button
// sits on a colored (non-white) surface and needs to stand out as white.
const whitePill = {
  ...outlinedPill,
  backgroundColor: '#FFF',
  '&:hover': {
    backgroundColor: '#F1F1F1',
    boxShadow: '0 2px 6px rgba(16, 40, 40, 0.14)',
  },
};

const useStyles = makeStyles(
  () => {
    return {
      button: outlinedPill,
      buttonDark: {
        ...pillBase,
        backgroundColor: '#3a4a4c',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        color: 'white',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.35)',
        '&:hover': {
          backgroundColor: '#46585a',
          boxShadow: '0 3px 10px rgba(0, 0, 0, 0.45)',
        },
      },
      buttonWhiteBackground: whitePill,
      buttonNoMargin: {
        ...outlinedPill,
        marginRight: 0,
      },
      buttonNoMarginWhite: {
        ...whitePill,
        marginRight: 0,
      },
      // The "primary" treatment from S-1: solid blue fill for the single main
      // affirmative action in a group.
      buttonPrimary: {
        ...pillBase,
        backgroundColor: '#2F80ED',
        border: '1px solid #2F80ED',
        color: 'white',
        boxShadow: '0 2px 6px rgba(47, 128, 237, 0.35)',
        '&:hover': {
          backgroundColor: '#1F6FD8',
          borderColor: '#1F6FD8',
          boxShadow: '0 4px 14px rgba(47, 128, 237, 0.45)',
        },
        '&:active': {
          transform: 'translateY(1px) scale(0.985)',
          boxShadow: '0 2px 6px rgba(47, 128, 237, 0.35)',
        },
      },
      buttonPrimaryNoMargin: {
        marginRight: 0,
      },
    }
  },
  { name: "Button" }
);

function SpinningIconLabelButton(props) {
  const {
    disabled = false,
    doSpin = true,
    children,
    icon: Icon,
    noMargin,
    onClick,
    whiteBackground,
    iconColor='black',
    iconOnly = false,
    id,
    toolTipId,
    focus,
    useDark,
    primary = false,
    ...rest
  } = props;
  const intl = useIntl();
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const classes = useStyles();
  const theme = useTheme();
  const spinning = operationRunning === id;
  const spinningDisabled = operationRunning !== false;
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
  // The main affirmative action gets a white icon to sit on the blue fill.
  const resolvedIconColor = primary && !myDisabled ? 'white' : iconColor;
  const myIcon = spinningDisabled || disabled ?
    <Icon color='disabled' style={{fontSize: iconOnly ? 24 : undefined}} /> :
    <Icon style={{ fontSize: iconOnly ? 24 : undefined }} htmlColor={resolvedIconColor} />;
  const BaseButton = focus ? FocusRippleButton : Button;
  let className;
  if (primary && !myDisabled) {
    className = noMargin ? `${classes.buttonPrimary} ${classes.buttonPrimaryNoMargin}` : classes.buttonPrimary;
  } else if (noMargin) {
    className = whiteBackground ? classes.buttonNoMarginWhite : classes.buttonNoMargin;
  } else if (whiteBackground) {
    className = classes.buttonWhiteBackground;
  } else if (useDark && !myDisabled) {
    className = classes.buttonDark;
  } else {
    className = classes.button;
  }
  const myButton = <BaseButton
    disabled={myDisabled}
    variant="outlined"
    size="small"
    id={id}
    autoFocus={focus}
    onClick={myOnClick}
    style={{whiteSpace: 'nowrap', width: 'fit-content', minWidth: 0}}
    startIcon={iconOnly ? undefined : myIcon}
    className={className}
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
  </BaseButton>;
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
  primary: PropTypes.bool,
  icon: PropTypes.object.isRequired
};

export default SpinningIconLabelButton;
