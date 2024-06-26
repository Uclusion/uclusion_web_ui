import React from 'react'
import PropTypes from 'prop-types'
import { IconButton, Tooltip } from '@material-ui/core'

import { useIntl } from 'react-intl'

function TooltipIconButton(props) {
  const {
    onClick, size, id, icon, translationId, disabled, children, doFloatRight, noPadding
  } = props;
  const intl = useIntl();
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
          style={{float: doFloatRight ? 'right': undefined, padding: noPadding ? 0 : undefined}}
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
