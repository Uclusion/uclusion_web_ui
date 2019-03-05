import React from 'react';
import PropTypes from 'prop-types';
import MemberListItem from './MemberListItem';

function MemberList(props) {
  const { users } = props;
  return (
    <div>
      {users && users.map(user => (
        <MemberListItem
          key={user.id}
          user={user}
        />
      ))}
    </div>
  );
}

MemberList.propTypes = {
  users: PropTypes.arrayOf(PropTypes.object),
};

export default MemberList;
