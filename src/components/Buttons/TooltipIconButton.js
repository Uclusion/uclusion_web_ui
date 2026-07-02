import React from 'react'
import PropTypes from 'prop-types'
import { IconButton, makeStyles, Tooltip } from '@material-ui/core'
import { useIntl } from 'react-intl'

const useStyles = makeStyles((theme) => ({
  buttonTopAlign: {
    alignItems: 'start',
    marginTop: '0.15rem'
  },
  // T-all-2255 (Q-all-188): comment cards keep a light surface in dark mode, so the
  // theme's white-alpha hover overlay and disabled tint are invisible there. Callers
  // whose button sits on a light card set lightSurface to get dark ones instead.
  lightSurface: theme.palette.type === 'dark' ? {
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.08)'
    },
    '&.Mui-disabled': {
      color: 'rgba(0, 0, 0, 0.3)'
    }
  } : {}
}));

function TooltipIconButton(props) {
  const {
    onClick = () => {}, size = 'small', id, icon, translationId, disabled = false, children, doFloatRight, noPadding, marginLeft, noAlign,
    marginRight, marginTop, lightSurface = false
  } = props;
  const intl = useIntl();
  const classes = useStyles();
  const usedId = id || translationId;
  const rootClass = [noAlign ? classes.buttonTopAlign : undefined,
    lightSurface ? classes.lightSurface : undefined].filter(Boolean).join(' ') || undefined;
  return (
    <>
      {!disabled && (
      <Tooltip
        title={intl.formatMessage({ id: translationId })}
      >
        <IconButton
          id={usedId}
          onClick={onClick}
          size={size}
          classes={{root: rootClass}}
          style={{float: doFloatRight ? 'right': undefined, padding: noPadding ? 0 : undefined, 
            marginLeft: marginLeft ? marginLeft : undefined, marginRight: marginRight ? marginRight : undefined,
            marginTop: marginTop ? marginTop : undefined}}
        >
          {React.cloneElement(icon, {})}
          {children}
        </IconButton>
      </Tooltip>
      )}
      {disabled && (
      <Tooltip
        title={intl.formatMessage({ id: translationId })}
      >
        {/* A disabled button stops firing pointer events, so the Tooltip must attach to a wrapping span. */}
        <span style={{float: doFloatRight ? 'right': undefined}}>
          <IconButton
            disabled={disabled}
            onClick={onClick}
            size={size}
            classes={{root: lightSurface ? classes.lightSurface : undefined}}
          >
            {React.cloneElement(icon, {})}
            {children}
          </IconButton>
        </span>
      </Tooltip>
      )}
    </>
  );
}

TooltipIconButton.propTypes = {
  translationId: PropTypes.string.isRequired,
  size: PropTypes.string,
  onClick: PropTypes.func,
  icon: PropTypes.element.isRequired,
  disabled: PropTypes.bool,
  id: PropTypes.string,
  lightSurface: PropTypes.bool,
};

export default TooltipIconButton;