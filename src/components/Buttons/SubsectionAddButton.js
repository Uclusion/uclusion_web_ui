import React from 'react';
import PropTypes from 'prop-types';
import { IconButton } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';

function SubsectionAddButton(props) {

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

SubsectionAddButton.propTypes = {
  onClick: PropTypes.func,
};

SubsectionAddButton.defaultProps = {
  onClick: () => {},
};

export default SubsectionAddButton;

