import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { ButtonGroup } from '@material-ui/core';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext';

function SpinBlockingButtonGroup(props) {

  const {
    children,
    ...rest
  } = props;

  const [operationRunning] = useContext(OperationInProgressContext);

  return (
    <ButtonGroup
      disabled={operationRunning}
      variant="contained"
      size="small"
      color="primary"
      {...rest}
    >
      {children}
    </ButtonGroup>
  );
}

SpinBlockingButtonGroup.propTypes = {
  children: PropTypes.node.isRequired,
};


export default SpinBlockingButtonGroup;
