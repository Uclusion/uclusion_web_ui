import React from 'react'
import PropTypes from 'prop-types'
import { IconButton, makeStyles, Tooltip } from '@material-ui/core'
import { useIntl } from 'react-intl'

const useStyles = makeStyles(() => ({
  buttonTopAlign: {
    alignItems: 'start',
    marginTop: '0.15rem'
  }
}));

function TooltipIconButton(props) {
  const {
    onClick, size, id, icon, translationId, disabled, children, doFloatRight, noPadding, marginLeft, noAlign, 
    marginRight, marginTop
  } = props;
  const intl = useIntl();
  const classes = useStyles();
  const usedId = id || translationId;
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
          classes={{root: noAlign ? classes.buttonTopAlign : undefined}}
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
      <IconButton
        disabled={disabled}
        onClick={onClick}
        size={size}
        style={{float: doFloatRight ? 'right': undefined}}
      >
        {React.cloneElement(icon, {})}
        {children}
      </IconButton>
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
};

TooltipIconButton.defaultProps = {
  disabled: false,
  size: 'small',
  onClick: () => {},
  id: undefined,
};

export default TooltipIconButton;
