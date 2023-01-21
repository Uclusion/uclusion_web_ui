
export function getTicket(state, value) {
  const fromUndecoded = state[value];
  if (fromUndecoded) {
    return fromUndecoded;
  }
  return state[decodeURI(value)];
}

export function isTicketPath(pathname) {
  return pathname && (pathname.startsWith('/J-') || pathname.startsWith('/B-'));
}

export function isJobTicket(pathname) {
  return pathname.startsWith('/J-');
}