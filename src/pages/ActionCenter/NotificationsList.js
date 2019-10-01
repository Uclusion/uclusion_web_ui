import React from 'react';
import PropTypes from 'prop-types';
import MessagesListItem from './MessagesListItem';


function NotificationsList(props) {

  const { messages } = props;

  function getMessageItems() {
    if (!messages || messages.length === 0) {
      return [];
    }
    return messages.map((message) => {
      return (
        <MessagesListItem
          key={message.market_id_user_id + message.type_object_id}
          message={message}
        />
      );
    });
  }

  return (
    <div>
      {getMessageItems()}
    </div>
  );
}

NotificationsList.propTypes = {
  messages: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default NotificationsList;

