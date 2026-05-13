import _ from 'lodash';

export function getBrowserTz() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

// Returns a YYYY-MM-DD key representing the calendar day of `dateLike`
// when interpreted in the IANA timezone `tz`. Falls back to the viewer's
// local timezone if `tz` is missing or invalid.
export function getLocalDayKey(dateLike, tz) {
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (Number.isNaN(d.getTime())) {
    return undefined;
  }
  const zone = isValidTz(tz) ? tz : getBrowserTz();
  // en-CA gives ISO-ish YYYY-MM-DD output which sorts lexicographically.
  try {
    return d.toLocaleDateString('en-CA', { timeZone: zone });
  } catch {
    return d.toLocaleDateString('en-CA');
  }
}

// Returns a human-readable day label (e.g. "Apr 14, 2026") for the given
// day key, interpreted in tz. Day keys are already in en-CA YYYY-MM-DD form
// so we parse them as a local-midnight Date for formatting purposes.
export function formatDayLabel(dayKey, tz) {
  if (_.isEmpty(dayKey)) {
    return '';
  }
  const [yearStr, monthStr, dayStr] = dayKey.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!year || !month || !day) {
    return dayKey;
  }
  // Build a noon UTC Date for the dayKey - using noon avoids any DST edge that
  // could otherwise push the label one day off when formatted back in `tz`.
  const noonUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const zone = isValidTz(tz) ? tz : getBrowserTz();
  try {
    return noonUtc.toLocaleDateString(undefined, {
      timeZone: zone,
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return noonUtc.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

function isValidTz(tz) {
  if (_.isEmpty(tz)) {
    return false;
  }
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
