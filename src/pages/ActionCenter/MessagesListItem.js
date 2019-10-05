import PropTypes from 'prop-types';
import React from 'react';
import { useHistory } from 'react-router';
import { Button } from '@material-ui/core';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';

function MessagesListItem(props) {
  const history = useHistory();
  const { message } = props;
  // eslint-disable-next-line camelcase
  const { market_id_user_id, type_object_id, level } = message;
  const marketSplit = market_id_user_id.split('_');
  const marketId = marketSplit[0];
  const typeSplitInt = type_object_id.lastIndexOf('_');
  const myType = type_object_id.substring(0, typeSplitInt);
  const objectType = myType.startsWith('INVESTIBLE') ? 'investible' : 'comment';
  const objectId = type_object_id.substring(typeSplitInt + 1);
  let link = `/dialog/${marketId}`;
  if (marketId !== objectId) {
    link = `/dialog/${marketId}#${objectType}=${objectId}`;
  }
  function handleClickItem() {
    history.push(link);
  }
  return (
    <ExpansionPanelDetails>
      { `${level}` }
      <Button onClick={handleClickItem}>
        {`${myType}`}
      </Button>
    </ExpansionPanelDetails>
  );
}

MessagesListItem.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  message: PropTypes.object.isRequired,
};

export default MessagesListItem;
