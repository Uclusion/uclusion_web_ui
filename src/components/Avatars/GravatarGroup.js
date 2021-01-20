import React from 'react';
import { AvatarGroup } from '@material-ui/lab';
import Gravatar from './Gravatar';
import PropTypes from 'prop-types';

function GravatarGroup(props) {

  const {
    gravatarClassName,
    users,
    max,
    spacing,
  } = props;

  return (
    <AvatarGroup
      max={max}
      spacing={spacing}
    >
      {users.map((user) => {
        const { id: userId, name, email } = user;
        return <Gravatar
          className={gravatarClassName}
          key={userId}
          email={email}
          name={name}
        />
      })
      }
    </AvatarGroup>
  );
}

GravatarGroup.propTypes = {
  users: PropTypes.arrayOf(PropTypes.object),
  gravatarClassName: PropTypes.string,
  max: PropTypes.number,
  spacing: PropTypes.string,
};

GravatarGroup.defaultProps = {
  users: [],
  gravatarClassName: '',
  max: 4,
  spacing: 'medium',
}

export default GravatarGroup;