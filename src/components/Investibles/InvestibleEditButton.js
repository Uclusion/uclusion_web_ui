import React from 'react';
import PropTypes from 'prop-types';
import EditIcon from '@material-ui/icons/Edit';
import { IconButton, Tooltip } from '@material-ui/core';
import { injectIntl } from 'react-intl';

function InvestibleEditButton(props) {

  const { onClick, intl } = props;

  return (
    <Tooltip title={intl.formatMessage({ id: 'investibleEditButtonTooltip' })}>
      <IconButton color="primary" onClick={onClick}>
        <EditIcon/>
      </IconButton>
    </Tooltip>
  );
}

InvestibleEditButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  intl: PropTypes.object.isRequired,
};

export default injectIntl(InvestibleEditButton);