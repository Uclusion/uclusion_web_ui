import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../components/utils';

function useBloblUrlCache() {
  const emptyCache = {};
  const BLOB_CACHE_KEY = 'blob_url_cache';

  function addBlobUrlToCache(path, blobUrl) {
    console.debug(`Adding blob url for ${path} to cache`);
    const state = getUclusionLocalStorageItem(BLOB_CACHE_KEY) || emptyCache;
    const newState = { ...state, [path]: blobUrl };
    console.debug(newState);
    setUclusionLocalStorageItem(BLOB_CACHE_KEY, newState);
    return Promise.resolve(blobUrl);
  }

  /** Gets a url for a blob that's resolveable,
   * or rejects if it can't find a valid one
   * @param path
   * @return {Promise<any | Response>}
   */
  function getBlobUrl(path){
    // make sure we have the url
    const state = getUclusionLocalStorageItem(BLOB_CACHE_KEY) || emptyCache;
    const entry = state[path];
    console.debug(`Found blob url ${entry} for ${path}`);
    // now we have to check if it's valid
    if (entry) {
      // to check if it's valid, fetch it. If it's not valid, we'll throw an error
      return fetch(entry)
        .then(() => Promise.resolve(entry));
    }
    // if we don't have it, reject
    return Promise.reject(path);
  }

  return {
    addBlobUrlToCache,
    getBlobUrl,
  };
}

export default useBloblUrlCache;
