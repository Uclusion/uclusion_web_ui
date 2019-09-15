import React from 'react';
import PropTypes from 'prop-types';
import EditIcon from '@material-ui/icons/Edit';
import { IconButton, Tooltip } from '@material-ui/core';
import { injectIntl } from 'react-intl';

function MarketEditButton(props){

  const { onClick, intl } = props;

  return (
    <Tooltip title={intl.formatMessage({ id: 'marketEditButtonTooltip' })}><IconButton onClick={onClick}><EditIcon /></IconButton></Tooltip>
  );
}

MarketEditButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  intl: PropTypes.object.isRequired,
};

export default injectIntl(MarketEditButton);