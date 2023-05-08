
export function isInPast(someDate) {
  if (!someDate) {
    return false;
  }
  const today = new Date();
  return today.getTime() - someDate.getTime() > 0;
}

export function getMidnightToday(rawDate) {
  const newDate = new Date(rawDate.getTime());
  newDate.setHours(23);
  newDate.setMinutes(59);
  newDate.setSeconds(59);
  newDate.setMilliseconds(99);
  return newDate;
}
