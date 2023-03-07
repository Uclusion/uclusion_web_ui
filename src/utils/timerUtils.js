
export function isInPast(someDate) {
  if (!someDate) {
    return false;
  }
  const today = new Date();
  return today.getTime() - someDate.getTime() > 0;
}
