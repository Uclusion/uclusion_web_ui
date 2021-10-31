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
    className,
  } = props;

  return (
    <AvatarGroup
      max={max}
      spacing={spacing}
      className={className}
    >
      {users.map((user) => {
        const { name, email, id } = user;
        return <Gravatar
          className={gravatarClassName}
          key={`grav${id}`}
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
  className: PropTypes.string,
};

GravatarGroup.defaultProps = {
  users: [],
  gravatarClassName: '',
  className: '',
  max: 4,
  spacing: 'medium',
}

export default GravatarGroup;