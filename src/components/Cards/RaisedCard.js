import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Card, useTheme, makeStyles } from '@material-ui/core';

const useStyles = makeStyles((theme) => {
  return {
    card: {
      padding: theme.spacing(2),
    },
  };
});


function RaisedCard(props) {
  const { border, onClick } = props;
  const theme = useTheme();
  const classes = useStyles();
  const [elevation, setElevation] = useState(6);

  return (
    <Box
      border={border}
      borderRadius="borderRadius"
      borderColor={theme.palette.primary.main}
    >
      <Card
        onClick={onClick}
        onMouseOver={() => setElevation(24)}
        onMouseOut={() => setElevation(6)}
        className={classes.card}
        elevation={elevation}
      >
        {props.children}
      </Card>
    </Box>
  );
}

RaisedCard.propTypes = {
  border: PropTypes.number,
  onClick: PropTypes.func,
};
RaisedCard.defaultProps = {
  border: 2,
  onClick: () => {},
};

export default RaisedCard;