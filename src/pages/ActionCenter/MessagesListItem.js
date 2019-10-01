import PropTypes from 'prop-types';

function MessagesListItem(props) {
  const { message } = props;
  // eslint-disable-next-line camelcase
  const { market_id_user_id, type_object_id, level } = message;

  return (
    { market_id_user_id, type_object_id, level }
  );
}

MessagesListItem.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  message: PropTypes.object.isRequired,
};

export default MessagesListItem;
