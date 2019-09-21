import React from 'react';
import { Slider } from '@material-ui/core';
import PropTypes from 'prop-types';


function VotingCertainty(props) {

  const { value, onChange } = props;

  function myOnChange(event, value) {
    onChange(value);
  }

  return (
    <Slider
      onChange={myOnChange}
      value={value}
      step={10}
      min={10}
      max={100}
      marks />
  );
}

VotingCertainty.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};

export default VotingCertainty;
