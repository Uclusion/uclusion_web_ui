import React from 'react';
import PropTypes from 'prop-types';
import { IconButton, Tooltip } from '@material-ui/core';

import { useIntl } from 'react-intl';

function TooltipIconButton(props) {
  const { onClick, size, icon, translationId, disabled } = props;
  const intl = useIntl();
  return (
    <Tooltip
      title={intl.formatMessage({ id: translationId })}
    >
      <IconButton
        disabled={disabled}
        onClick={onClick}
      >
        {React.cloneElement(icon, { size })}
      </IconButton>
    </Tooltip>
  );

}

TooltipIconButton.propTypes = {
  translationId: PropTypes.string.isRequired,
  size: PropTypes.string,
  onClick: PropTypes.func,
  icon: PropTypes.element.isRequired,
  disabled: PropTypes.bool,
};

TooltipIconButton.defaultProps = {
  disabled: false,
  size: 'small',
  onClick: () => {},
};

export default TooltipIconButton;
