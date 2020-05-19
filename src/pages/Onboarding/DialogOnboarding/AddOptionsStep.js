import React from 'react';
import PropTypes from 'prop-types';

function AddOptionsStep(props) {

}

AddOptionsStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
  active: PropTypes.bool,
}

AddOptionsStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
  active: false,
}

export default AddOptionsStep;