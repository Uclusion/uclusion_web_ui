import { DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets';
import ListAltIcon from '@material-ui/icons/ListAlt';
import GavelIcon from '@material-ui/icons/Gavel';
import PollIcon from '@material-ui/icons/Poll';
import React from 'react';

export function getDialogTypeIcon(type, isSmall = false) {
  switch (type) {
    case PLANNING_TYPE:
      return <ListAltIcon fontSize={isSmall? 'small' : 'default'} />;
    case DECISION_TYPE:
      return <GavelIcon htmlColor="#828282" fontSize={isSmall? 'small' : 'default'} />;
    case INITIATIVE_TYPE:
      return <PollIcon htmlColor="#828282" fontSize={isSmall? 'small' : 'default'} />;
    default:
      return null;
  }
}