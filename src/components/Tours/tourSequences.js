
import { INVITE_DIALOG_FAMILY_NAME, INVITE_DIALOG_SEQUENCE } from './InviteTours/dialog';
import { INVITE_INITIATIVE_FAMILY_NAME, INVITE_INITIATIVE_SEQUENCE } from './InviteTours/initiative';
import { INVITE_REQ_WORKSPACE_FAMILY_NAME, INVITE_REQ_WORKSPACE_SEQUENCE } from './InviteTours/requirementsWorkspace';
import { INVITE_STORIES_WORKSPACE_FAMILY_NAME, INVITE_STORIES_WORKSPACE_SEQUENCE } from './InviteTours/storyWorkspace';


export function getTourSequence(familyName) {
  switch(familyName) {
    case INVITE_DIALOG_FAMILY_NAME:
      return INVITE_DIALOG_SEQUENCE;
    case INVITE_INITIATIVE_FAMILY_NAME:
      return INVITE_INITIATIVE_SEQUENCE;
    case INVITE_REQ_WORKSPACE_FAMILY_NAME:
      return INVITE_REQ_WORKSPACE_SEQUENCE;
    case INVITE_STORIES_WORKSPACE_FAMILY_NAME:
      return INVITE_STORIES_WORKSPACE_SEQUENCE;
    default:
      return [];
  }
}