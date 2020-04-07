import _ from 'lodash';
/**
 Like Promise.all, but each promise executes sequentially instead of in parallel
 * @param promises array of promises to run
 */
export function AllSequentialMap(sources, promiseGenerator) {
  return sources.reduce((acc, source) => {
    return acc.then((previous) => {
      // // console.debug(previous);
      return promiseGenerator(source)
        .then((result) => {
          // // console.debug(result);
          return [...previous, result];
        });
    });
  }, Promise.resolve([]));
}

/**
 * Splits the sources into parallellThreads buckets,
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