import {
  PURE_SIGNUP_FAMILY_NAME,
  PURE_SIGNUP_SEQUENCE
} from './pureSignupTours';


export function getTourSequence(familyName) {
  switch(familyName) {
    case PURE_SIGNUP_FAMILY_NAME:
      return PURE_SIGNUP_SEQUENCE;
    default:
      return [];
  }
}