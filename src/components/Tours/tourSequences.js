
import { INVITE_DIALOG_FAMILY_NAME, INVITE_DIALOG_SEQUENCE } from './InviteTours/dialog';


export function getTourSequence(familyName) {
  switch(familyName) {
    case INVITE_DIALOG_FAMILY_NAME:
      return INVITE_DIALOG_SEQUENCE;
    default:
      return [];
  }
}