import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Grid } from '@material-ui/core';
import MemberListItem from './MemberListItem';
import { getClient } from '../../config/uclusionClient';
import { ERROR, sendIntlMessage } from '../../utils/userMessage';

function MemberList(props) {
  const [users, setUsers] = useState(undefined);
  const { teamId } = props;
  useEffect(() => {
    const clientPromise = getClient();
    clientPromise.then(client => client.teams.get(teamId)).then((response) => {
      setUsers(response.users);
    }).catch((error) => {
      console.log(error);
      sendIntlMessage(ERROR, { id: 'teamMemberLoadFailed' });
    });
    return () => {};
  }, []);
  return (
    <Grid container spacing={16}>
      {users && users.map(user => <MemberListItem key={user.id} user={user} />)}
    </Grid>
  );
}

MemberList.propTypes = {
  teamId: PropTypes.string.isRequired,
};

export default MemberList;
