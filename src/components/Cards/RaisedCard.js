import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Card } from '@material-ui/core';

function RaisedCard(props) {
  const { onClick } = props;
  const [elevation, setElevation] = useState(6);

  return (
    <Box
      borderRadius="borderRadius"
      p={0}
    >
      <Card
        onClick={onClick}
        onMouseOver={() => setElevation(24)}
        onMouseOut={() => setElevation(6)}
        elevation={elevation}
        p={0}
        style={{boxShadow: 'none'}}
      >
        {props.children}
      </Card>
    </Box>
  );
}

RaisedCard.propTypes = {
  onClick: PropTypes.func,
};
RaisedCard.defaultProps = {
  onClick: () => {},
};

export default RaisedCard;