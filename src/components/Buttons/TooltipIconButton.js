import React from 'react';
import PropTypes from 'prop-types';
import { IconButton, Tooltip } from '@material-ui/core';

import { useIntl } from 'react-intl';

function TooltipIconButton(props) {
  const { onClick, size, icon, translationId } = props;
  const intl = useIntl();
  return (
    <Tooltip
      title={intl.formatMessage({ id: translationId })}
    >
      <IconButton
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
};

TooltipIconButton.defaultProps = {
  size: 'small',
  onClick: () => {},
};

export default TooltipIconButton;
