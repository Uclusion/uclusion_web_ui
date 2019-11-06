/**
 Like Promise.all, but each promise executes sequentially instead of in parallel
 * @param promises array of promises to run
 */
export function AllSequential(promises) {
  let chain = Promise.resolve([]);
  if (promises.length < 1) {
    return chain;
  }
  const acc = [];
  for(let i = 0; i < promises.length; i += 1) {
    const promise = promises[i];
    chain = chain.then(() => {
      return promise.then((result) => {
        acc.push(result);
        return acc;
      });
    });
  }
  return chain;
}
