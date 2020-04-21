import { ISSUE_TYPE } from '../constants/notifications';

export function messageComparator (a, b) {
  if (a.level === b.level) {
    if (a.aType === b.aType || a.level !== 'RED') {
      return 0;
    }
    if (a.aType === ISSUE_TYPE) {
      return -1;
    }
    if (b.aType === ISSUE_TYPE) {
      return 1;
    }
    return 0;
  }
  if (a.level === 'RED') {
    return -1;
  }
  return 1;
}