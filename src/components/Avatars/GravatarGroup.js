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
    };
  },
  { name: "GravatarGroup" }
);

function GravatarGroup(props) {

  const {
    gravatarClassName,
    gravatarHighlightClassName,
    users,
    max,
    spacing,
    className,
    highlightList=[]
  } = props;
  const classes = gravatarGroupStyles();

  return (
    <AvatarGroup
      max={max}
      spacing={spacing}
      className={className}
    >
      {users.map((user) => {
        const { name, email, id } = user;
        return <Gravatar
          className={highlightList.includes(id) ? (gravatarHighlightClassName || classes.gravatarHighlight) : gravatarClassName}
          key={`grav${id || email}`}
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
// max set extremely high for now to avoid https://stage.uclusion.com/dd56682c-9920-417b-be46-7a30d41bc905/T-all-1463
GravatarGroup.defaultProps = {
  users: [],
  gravatarClassName: '',
  className: '',
  max: 10,
  spacing: 'medium',
}

export default GravatarGroup;