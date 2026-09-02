import { isSignedOut } from './logoutState';

export function shouldReportApiError() {
  try {
    return !isSignedOut();
  } catch {
    return true;
  }
}
