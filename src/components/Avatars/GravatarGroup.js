import React from 'react';
import { AvatarGroup } from '@material-ui/lab';
import Gravatar from './Gravatar';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core';

const gravatarGroupStyles = makeStyles(
  ( ) => {
    return {
      gravatarHighlight: {
        padding: '6px',
        backgroundColor: '#e6e969',
      },
      customAvatarStyle: {
        '& .MuiAvatarGroup-avatar': {
          border: 'none',
        },
      },
    };
  },
  { name: "GravatarGroup" }
);

function GravatarGroup(props) {

  const {
    gravatarClassName = '',
    gravatarHighlightClassName,
    users = [],
    max = 10,
    spacing = 'medium',
    className = '',
    highlightList = [],
    onClick = () => {}
  } = props;
  const classes = gravatarGroupStyles();

  return (
    <AvatarGroup
      max={max}
      spacing={spacing}
      className={className || classes.customAvatarStyle}
    >
      {users.map((user) => {
        const { name, email, id } = user;
        return <Gravatar
          className={highlightList.includes(id) ? (gravatarHighlightClassName || classes.gravatarHighlight) : gravatarClassName}
          key={`grav${id || email}`}
          email={email}
          name={name}
          onClick={(event) => onClick(event, user)}
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
  onClick: PropTypes.func
};
export default GravatarGroup;