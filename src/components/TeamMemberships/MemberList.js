import React from 'react';
import PropTypes from 'prop-types';
import MemberListItem from './MemberListItem';
import { processUserForDisplay } from '../../utils/userMembershipFunctions';

function MemberList(props) {
  const { allUsers, userIds, marketId } = props;
  return (
    <div>
      {allUsers && userIds && userIds.map(userId => (
        allUsers[userId] && (
          <MemberListItem
            key={userId}
            user={processUserForDisplay(allUsers[userId], marketId)}
          />
        )
      ))}
    </div>
  );
}

MemberList.propTypes = {
  marketId: PropTypes.string.isRequired, //eslint-disable-line
  allUsers: PropTypes.object.isRequired, //eslint-disable-line
  userIds: PropTypes.arrayOf(PropTypes.string), //eslint-disable-line
};

export default MemberList;
