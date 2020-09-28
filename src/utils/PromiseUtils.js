import _ from 'lodash'

/**
 Like Promise.all, but each promise executes sequentially instead of in parallel
 * @param sources
 * @param promiseGenerator function that takes an item from source array and returns a promise
 * @param doThrowError - set to false to suppress errors
 */
export function AllSequentialMap(sources, promiseGenerator, doThrowError=true) {
  return sources.reduce((acc, source) => {
    return acc.then((previous) => {
      // // console.debug(previous);
      const aPromise = promiseGenerator(source);
      if (!aPromise) {
        console.error(JSON.stringify(source));
        return [...previous];
      }
      return aPromise.then((result) => {
          // // console.debug(result);
          return [...previous, result];
        }).catch((error) => {
          if (doThrowError) {
            throw error;
          }
        console.error(error);
        return [...previous];
      });
    });
  }, Promise.resolve([]));
}

/**
 * Splits the sources into parallelThreads buckets,
 * and executes each bucket sequentially, but all buckets in parallel
 * @param sources
 * @param parallelThreads
 * @constructor
 */
export function LimitedParallelMap(sources, promiseGenerator, parallelThreads) {
  const elementsPerChunk = Math.ceil(sources.length / (parallelThreads * 1.0));
  //console.log(`elments per chunk ${elementsPerChunk}`);
  const chunked = _.chunk(sources, elementsPerChunk);
  //console.log(chunked);
  const promises = chunked.reduce((acc, chunk) => {
    return [...acc, AllSequentialMap(chunk, promiseGenerator)]
  }, []);
  return Promise.all(promises)
    .then((results) => _.flatten(promises));
}