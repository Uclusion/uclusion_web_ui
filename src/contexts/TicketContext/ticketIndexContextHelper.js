
export function getTicket(state, value) {
  return state[value];
}

export function isTicketPath(pathname) {
  return pathname && (pathname.startsWith('/J-') || pathname.startsWith('/B-'));
}

export function isJobTicket(pathname) {
  return pathname.startsWith('/J-');
}