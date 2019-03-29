import React from 'react';
import PropTypes from 'prop-types';
import MemberListItem from './MemberListItem';

function MemberList(props) {
  const { allUsers, userIds } = props;
  return (
    <div>
      {allUsers && userIds && userIds.map(userId => (
        allUsers[userId] && (
          <MemberListItem
            key={userId}
            user={allUsers[userId]}
          />
        )
      ))}
    </div>
  );
}

MemberList.propTypes = {
  allUsers: PropTypes.object.isRequired, //eslint-disable-line
  userIds: PropTypes.arrayOf(PropTypes.string), //eslint-disable-line
};

export default MemberList;
