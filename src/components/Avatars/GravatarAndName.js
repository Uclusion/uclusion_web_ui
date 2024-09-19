import React from 'react';
import Gravatar from './Gravatar';
import { Typography } from '@material-ui/core';
import PropTypes from 'prop-types';


function GravatarAndName(props) {

  const {
    email,
    name,
    label,
    useBlank,
    avatarClassName,
    typographyClassName,
    typographyComponent,
    typographyVariant,
  } = props;

  return (
    <div style={{display: 'flex', alignItems: 'center', paddingLeft: !label ? '0.5rem' : undefined}}>
      {label && (
        <Typography style={{marginRight: 6}} variant={typographyVariant} className={typographyClassName}
                    component={typographyComponent}>
          {label}
        </Typography>
      )}
      <Gravatar name={name} email={email} useBlank={useBlank} className={avatarClassName}/>
      <Typography style={{marginLeft: 6, marginRight: 6, maxWidth: '11rem'}}
                  variant={typographyVariant} className={typographyClassName}
                  component={typographyComponent}>
        {name}
      </Typography>
    </div>
  );
}

GravatarAndName.propTypes = {
  email: PropTypes.string,
  name: PropTypes.string,
  avatarClassName: PropTypes.string,
  typographyClassName: PropTypes.string,
  typographyComponent: PropTypes.string,
  typographyVariant: PropTypes.string,
  useBlank: PropTypes.bool,
};

GravatarAndName.defaultProps = {
  email: '',
  name: '',
  typographyClassName: '',
  avatarClassName: '',
  useBlank: false,
  typographyComponent: undefined,
  typographyVariant: 'body1',
};

export default GravatarAndName;
