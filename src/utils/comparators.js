/**
 * A comparator that compares in reverse date order
 * @param d1 the first date
 * @param d2 the second date
 * @returns {number} -1 0 1 if d1 is > = or < than d2
 */
export function reverseDateComparator(d1, d2) {
  if (d1 > d2) {
    return -1;
  }
  if (d1 < d2) {
    return 1;
  }
  return 0;
}

/**
 * Take a variable number of comparator functions. Returns
 * a comparator that evaluates each passed in comparator in turn.
 * @returns {Function}
 */
export function combineComparators() {
  return (x1, x2) => {
    for (var i = 0; i < arguments.length; i++) {
      const comparator = arguments[i];
      const result = comparator(x1, x2);
      if (result !== 0) {
        return result;
      }
    }
    return 0;
  };
}