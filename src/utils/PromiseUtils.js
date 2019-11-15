/**
 Like Promise.all, but each promise executes sequentially instead of in parallel
 * @param promises array of promises to run
 */
export function AllSequentialMap(sources, promiseGenerator) {
  return sources.reduce((acc, source) => {
    return acc.then((previous) => {
      //console.debug(previous);
      return promiseGenerator(source)
        .then((result) => {
          //console.debug(result);
          return [...previous, result];
        });
    });
  }, Promise.resolve([]));
}
