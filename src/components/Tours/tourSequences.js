
import { INVITE_DIALOG_FAMILY_NAME, INVITE_DIALOG_SEQUENCE } from './InviteTours/dialog';
import { INVITE_INITIATIVE_FAMILY_NAME, INVITE_INITIATIVE_SEQUENCE } from './InviteTours/initiative';


export function getTourSequence(familyName) {
  switch(familyName) {
    case INVITE_DIALOG_FAMILY_NAME:
      return INVITE_DIALOG_SEQUENCE;
    case INVITE_INITIATIVE_FAMILY_NAME:
      return INVITE_INITIATIVE_SEQUENCE;
    default:
      return [];
  }
}