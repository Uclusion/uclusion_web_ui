import PropTypes from 'prop-types';
import { ExpansionPanelDetails } from '@material-ui/core';
import React from 'react';

function MessagesListItem(props) {
  const { message } = props;
  // eslint-disable-next-line camelcase
  const { market_id_user_id, type_object_id, level } = message;

  return (
    <ExpansionPanelDetails>
      { `${market_id_user_id} ${type_object_id} ${level}` }
    </ExpansionPanelDetails>
  );
}

MessagesListItem.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  message: PropTypes.object.isRequired,
};

export default MessagesListItem;
