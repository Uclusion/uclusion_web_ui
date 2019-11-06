/**
 Like Promise.all, but each promise executes sequentially instead of in parallel
 * @param promises array of promises to run
 */
export function AllSequentialMap(sources, promiseGenerator) {
  let chain = Promise.resolve([]);
  if (sources.length < 1) {
    return chain;
  }
  const acc = [];
  for (let i = 0; i < sources.length; i += 1) {
    const source = sources[i];
    chain = chain.then(() => {
      return promiseGenerator(source).then((result) => {
        acc.push(result);
        return acc;
      });
    });
  }
  return chain;
}
