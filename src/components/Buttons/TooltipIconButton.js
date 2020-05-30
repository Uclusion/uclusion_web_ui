import React from 'react'
import PropTypes from 'prop-types'
import { IconButton, Tooltip } from '@material-ui/core'

import { useIntl } from 'react-intl'

function TooltipIconButton(props) {
  const {
    onClick, size, id, icon, translationId, disabled, children
  } = props;
  const intl = useIntl();
  return (
    <>
      {!disabled && (
      <Tooltip
        title={intl.formatMessage({ id: translationId })}
      >
        <IconButton
          onClick={onClick}
        >
          {React.cloneElement(icon, { size })}
          {children}
        </IconButton>
      </Tooltip>
      )}
      {disabled && (
      <IconButton
        disabled={disabled}
        onClick={onClick}
      >
        {React.cloneElement(icon, { size })}
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

};

export default TooltipIconButton;
