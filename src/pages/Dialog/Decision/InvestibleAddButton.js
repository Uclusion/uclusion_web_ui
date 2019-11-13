import React from 'react';
import PropTypes from 'prop-types';
import { IconButton } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';

function InvestibleAddButton(props) {

  const {
    onClick,
  } = props;

  return (
    <IconButton
      onClick={onClick}
      color="primary"
    >
      <AddIcon />
    </IconButton>
  );
}

InvestibleAddButton.propTypes = {
  onClick: PropTypes.func,
};

InvestibleAddButton.defaultProps = {
  onClick: () => {},
};

export default InvestibleAddButton;

