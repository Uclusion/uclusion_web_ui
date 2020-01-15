import React, { useState, useEffect } from 'react';
import { Auth } from 'aws-amplify';
import _ from 'lodash';
import { Chip, Avatar } from '@material-ui/core';
import { useHistory } from 'react-router';
import { navigate } from '../../utils/marketIdPathFunctions';

function Identity() {

  const [user, setUser] = useState(null);
  const history = useHistory();

  useEffect(() => {
    if (!user) {
      Auth.currentAuthenticatedUser()
        .then((user) => {
          const { attributes } = user;
          setUser(attributes);
        });
    }
  });
  const chipLabel = !user? '' : user.name;
  const chipAvatar = _.isEmpty(chipLabel)? '' : chipLabel.substr(0,1);

  function goToAbout() {
    navigate(history, '/about');
  }

  return (
    <Chip
      avatar={<Avatar>{chipAvatar}</Avatar>}
      label={chipLabel}
      onClick={goToAbout}
    />

  );
}
export default Identity;
