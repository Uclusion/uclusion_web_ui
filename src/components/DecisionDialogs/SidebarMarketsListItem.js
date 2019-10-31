import React from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { MenuItem } from '@material-ui/core';

import { formMarketLink, navigate } from '../../utils/marketIdPathFunctions';
import { makeStyles } from '@material-ui/styles';

const useStyles = makeStyles({
  item: {
    marginTop: 0,
    marginBottom: 0,
    paddingTop:0,
    paddingBottom:0,
  },
});

function MarketsListItem(props) {
  const history = useHistory();
  const classes = useStyles();
  const { market } = props;
  const { name, id } = market;

  return (
    <MenuItem
      onClick={() => navigate(history, formMarketLink(id))}
      key={id}
      className={classes.item}
    >
      {name}
    </MenuItem>
  );
}

MarketsListItem.propTypes = {
  market: PropTypes.object.isRequired,
};

export default MarketsListItem;
