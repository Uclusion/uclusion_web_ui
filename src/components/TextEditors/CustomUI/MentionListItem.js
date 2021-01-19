import React from 'react';
import PropTypes from 'prop-types';
import Gravatar from '../../Avatars/Gravatar';
import { Typography } from '@material-ui/core';


function MentionListItem(props) {
  const {
    mentionResult
  } = props;

  const { value: name, email } = mentionResult;

  return (
    <div
      style={{display: 'flex', alignItems: 'center'}}
    >
      <Gravatar
        name={name}
        email={email}
      />
      <Typography style={{marginLeft: 6}}>
        {name}
      </Typography>
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


