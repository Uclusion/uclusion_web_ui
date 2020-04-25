import { DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets';
import PlaylistAddCheckIcon from '@material-ui/icons/PlaylistAddCheck';
import GavelIcon from '@material-ui/icons/Gavel';
import PollIcon from '@material-ui/icons/Poll';
import React from 'react';

export function getDialogTypeIcon(type, isSmall = false, htmlColor = '#828282' ) {
  switch (type) {
    case PLANNING_TYPE:
      return <PlaylistAddCheckIcon htmlColor={htmlColor} fontSize={isSmall? 'small' : 'default'} />;
    case DECISION_TYPE:
      return <GavelIcon htmlColor={htmlColor} fontSize={isSmall? 'small' : 'default'} />;
    case INITIATIVE_TYPE:
      return <PollIcon htmlColor={htmlColor} fontSize={isSmall? 'small' : 'default'} />;
    default:
      return null;
  }
}