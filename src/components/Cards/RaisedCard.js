import React from 'react';
import PropTypes from 'prop-types';
import { Box, Card, makeStyles } from '@material-ui/core';
import clsx from 'clsx'

const useStyles = makeStyles({
  card: {
    padding: '8px',
    display: 'flex',
    flexDirection: 'column'
  },
  rowStyle: {
    "&:hover": { boxShadow: '0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px black'},
    display: 'flex',
    flexDirection: 'column'
  },
  noClass: {

  },
  highlightedCard: {
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px red'
  }
})

function RaisedCard(props) {
  const { onClick, elevation, className, cardClassName, isHighlighted, rowStyle, draggable, onDragStart } = props;
  const elevated = elevation ? elevation : 0;
  const classes = useStyles(onClick);
  let isClickable = typeof onClick === 'function' ? true : false;
  if( onClick.toString() === '() => {}' || onClick.toString() === '()=>{}'){ //preminification has spaces - minified does not, check for both
    isClickable = false;
  }
  const useCardClassName = cardClassName || classes.noClass;
  return (
    <Box
      p={0}
      style={{height: '100%'}}
      className={className}
    >
      <Card
        onClick={onClick}
        elevation={elevated}
        p={0}
        draggable={draggable}
        onDragStart={onDragStart}
        style={{ height: '100%', cursor: isClickable ? 'pointer' : 'default'}}
        className={clsx(useCardClassName, rowStyle ? classes.rowStyle :
          (isHighlighted ? classes.highlightedCard : classes.card))}
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