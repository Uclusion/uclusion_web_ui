import React from 'react';
import PropTypes from 'prop-types';
import GravatarAndName from '../../Avatars/GravatarAndName';


function MentionListItem(props) {
  const {
    mentionResult
  } = props;

  const { value: name, email } = mentionResult;

  return (
    <div style={{ color: 'black' }}>
       <GravatarAndName name={name} email={email} />
    </div>
  );
}

MentionListItem.propTypes = {
  mentionResult: PropTypes.shape({
    value: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
  }).isRequired
};

export default MentionListItem;


