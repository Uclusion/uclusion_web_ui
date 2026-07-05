import React from 'react';
import _ from 'lodash';
import { Typography } from '@material-ui/core';
import GravatarGroup from '../Avatars/GravatarGroup';
import { wizardStyles } from './WizardStylesContext';

function PokeReminder(props) {
  const { pokeList, prefix } = props;
  const classes = wizardStyles();
  if (_.isEmpty(pokeList) && !prefix) {
    return null;
  }
  return (
    <Typography className={classes.introSubText} variant="subtitle1"
                style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
      {prefix && (<span>{prefix}&nbsp;</span>)}
      {!_.isEmpty(pokeList) && (
        <>
          Poke to remind&nbsp;<GravatarGroup users={pokeList} gravatarClassName={classes.smallGravatar}/>&nbsp;to
          respond.
        </>
      )}
    </Typography>
  );
}

export default PokeReminder;
