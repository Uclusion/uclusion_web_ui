import React from 'react';
import PropTypes from 'prop-types';
import GravatarAndName from '../../Avatars/GravatarAndName';


function MentionListItem(props) {
  const {
    mentionResult
  } = props;

  const { value: name, email, disabled, isJob, ticketCode } = mentionResult;

  // J-all-348 (S-1 under Q-all-224): disabled hint row teaching the other trigger character
  if (disabled) {
    return (
      <div style={{ color: 'grey', fontStyle: 'italic' }}>
        {name}
      </div>
    );
  }

  // J-all-348: a job row - ticket code disambiguates similar names in the dropdown only;
  // the inserted link text comes from the paste handler. A name too long even for the widened
  // container ellipsizes instead of wrapping to a second line
  if (isJob) {
    return (
      <div style={{ color: 'black', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {ticketCode ? `${ticketCode} ${name}` : name}
      </div>
    );
  }

  return (
    <div style={{ color: 'black' }}>
       {/* J-all-348: this renders via renderToString + innerHTML, so the Avatar's JS image
          fallback cannot run - request gravatar's silhouette instead of a 404 broken image */}
       <GravatarAndName name={name} email={email} defaultImage='mp' />
    </div>
  );
}

MentionListItem.propTypes = {
  mentionResult: PropTypes.shape({
    value: PropTypes.string.isRequired,
    email: PropTypes.string,
    id: PropTypes.string.isRequired,
  }).isRequired
};

export default MentionListItem;
