import { setRedirect } from '../../utils/redirectUtils';

const SETUP_PATH = /^\/setup\/([A-Za-z0-9_-]{1,128})\/?$/;

export function parseSetupPath(pathname) {
  if (typeof pathname !== 'string') {
    return undefined;
  }
  const match = pathname.match(SETUP_PATH);
  if (!match) {
    return undefined;
  }
  return {
    pathname: `/setup/${match[1]}`,
    setupId: match[1],
  };
}

export function getSetupRoute(pathname, savedRedirect) {
  return parseSetupPath(pathname) || parseSetupPath(savedRedirect);
}

export function switchSetupAccount(signOut, history, setupPath) {
  const setupRoute = parseSetupPath(setupPath);
  if (!setupRoute) {
    return Promise.reject(new Error('Invalid setup path'));
  }
  return Promise.resolve().then(signOut).then(() => {
    setRedirect(setupRoute.pathname);
    history.replace(setupRoute.pathname);
  });
}
