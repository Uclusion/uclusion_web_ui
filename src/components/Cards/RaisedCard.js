import React from 'react';
import PropTypes from 'prop-types';
import { Box, Card, makeStyles } from '@material-ui/core';
import clsx from 'clsx'
import { CARD_BORDER_COLOR, DARK_CARD_BORDER_COLOR } from '../Buttons/ButtonConstants'

const useStyles = makeStyles((theme) => {
  // Visible card border so cards read as distinct from the main area without
  // changing their progression fills (T-all-2173, Q-all-128 / C-all-980).
  const cardBorder = `1px solid ${theme.palette.type === 'dark' ? DARK_CARD_BORDER_COLOR : CARD_BORDER_COLOR}`;
  return {
  card: {
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    border: cardBorder
  },
  rowStyle: {
    "&:hover": { boxShadow: '0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px black'},
    display: 'flex',
    flexDirection: 'column'
  },
  noClass: {

  },

  highlightedCard: {
    "&:hover": { boxShadow: '0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px black'},
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.primary.highlight,
    border: cardBorder
  }
  }
});

function RaisedCard(props) {
  const { onClick = () => {}, elevation, className, cardClassName, isHighlighted, rowStyle, draggable, onDragStart, maxWidth, cardStyle } = props;
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
      style={{height: '100%', maxWidth: maxWidth}}
      className={className}
    >
      <Card
        onClick={onClick}
        elevation={elevated}
        p={0}
        draggable={draggable}
        onDragStart={onDragStart}
        style={{ height: '100%', cursor: isClickable ? 'pointer' : 'default', ...cardStyle}}
        className={clsx(useCardClassName, isHighlighted ? classes.highlightedCard :
          (rowStyle ? classes.rowStyle : classes.card))}
      >
        {props.children}
      </Card>
    </Box>
  );
}

RaisedCard.propTypes = {
  onClick: PropTypes.func,
};
export default RaisedCard;