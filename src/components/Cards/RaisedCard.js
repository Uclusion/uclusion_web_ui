import React from 'react';
import PropTypes from 'prop-types';
import { Box, Card, makeStyles } from '@material-ui/core';

const useStyles = makeStyles({
  card: {
    padding: '8px',
    display: 'flex',
    flexDirection: 'column'
  },
  clickableCard: {
    padding: '8px',
    display: 'flex',
    flexDirection: 'column'
  }
})

function RaisedCard(props) {
  const { onClick, elevation, className } = props;
  const elevated = elevation ? elevation : 0;
  const classes = useStyles(onClick);
  let isClickable = typeof onClick === 'function' ? true : false;
  if( onClick.toString() === '() => {}' || onClick.toString() === '()=>{}'){ //preminification has spaces - minified does not, check for both
    isClickable = false;
  }
  return (
    <Box
      borderRadius="borderRadius"
      p={0}
      style={{height: '100%'}}
      className={className}
    >
      <Card
        onClick={onClick}
        elevation={elevated}
        p={0}
        style={{ height: '100%', cursor: isClickable ? 'pointer' : 'default'}}
        className={isClickable ? classes.clickableCard : classes.card}
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