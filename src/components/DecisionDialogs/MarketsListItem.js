import React from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import {ListItem, ListItemText } from '@material-ui/core';

import { formMarketLink, navigate } from '../../utils/marketIdPathFunctions';

function MarketsListItem(props) {
  const history = useHistory();
  const { market } = props;
  const { name, id } = market;

  return (
    <ListItem button key={id}>
      <ListItemText onClick={() => navigate(history, formMarketLink(id))}>
        {name}
      </ListItemText>
    </ListItem>
  );
}

MarketsListItem.propTypes = {
  market: PropTypes.object.isRequired,
};

export default MarketsListItem;
