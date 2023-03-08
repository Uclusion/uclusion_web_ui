import _ from 'lodash';

export function getTicket(state, value) {
  const fromUndecoded = state[value];
  if (fromUndecoded) {
    return fromUndecoded;
  }
  return state[decodeURI(value)];
}

export function isTicketPath(pathname) {
  return !_.isEmpty(pathname?.match('\\/[A-Z]-'));
}

export function isJobTicket(pathname) {
  return pathname?.includes('/J-');
}