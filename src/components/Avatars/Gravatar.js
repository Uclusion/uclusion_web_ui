import React from 'react';
import PropTypes from 'prop-types';
import { Avatar, Tooltip } from '@material-ui/core'
import md5 from 'md5';
import { nameToAvatarText } from '../../utils/stringFunctions';

function Gravatar (props) {
  const {
    email,
    name,
    useBlank,
    className,
  } = props;

  const blankCode = useBlank ? 'blank' : '404';
  const url = `https://www.gravatar.com/avatar/${md5(email, { encoding: 'binary' })}?d=${blankCode}`;



  // you won't get the default image if you have a child element,
  // so we have to have two versions of the avatar render
  if (name) {
    return (
      <Tooltip key={`tip${email}`} title={name}>
        <div>
          <Avatar
            className={className}
            key={email}
            src={url}
          >
            {nameToAvatarText(name)}
          </Avatar>
        </div>
      </Tooltip>
    )
  }

  return (
    <Tooltip key={`tip${email}`} title={name}>
      <div>
        <Avatar
          className={className}
          key={email}
          src={url}
        />
      </div>
    </Tooltip>
  );
}

Gravatar.propTypes = {
  email: PropTypes.string,
  name: PropTypes.string,
  useBlank: PropTypes.bool,
};

Gravatar.defaultProps = {
  user: '',
  name: '',
  email: '',
  useBlank: false,
};

export default Gravatar;
