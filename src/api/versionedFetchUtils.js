import { getMarketDetails, getMarketUsers } from './markets';
import { fetchInvestibles } from './marketInvestibles';
import { fetchComments } from './comments';
import _ from 'lodash';

// the delay between sequential calls to the api. Used to let things
// become "eventually" consistent
const FETCH_WAIT_DELAY = 6000;
// the default number of times we'll fetch before we decide it's never going to be consistent
const MAX_FETCH_TRIES = 20;

/**
 * A matcher that checks if the version is greater than or equal to the
 * value in the signature. However, If the signature contains an ID key (e..g market_id) then it
 * checks for exact match for the objects value with that key
 * @param signature
 * @param object
 * @returns {boolean}
 */
function signatureMatches(signature, object) {
  for (const key of Object.keys(signature)) {
    const signatureVersion = signature[key];
    const objectVersion = object[key];
    if (!objectVersion) {
      return false;
    }
    let keySatisfied;
    if (_.isArray(signatureVersion)) {
      if (!_.isArray(objectVersion)) {
        return false;
      }
      // we're not going to consider order, so we'll consider a match if
      // a least one of the objectVersion entries matches the signatureVersion
      keySatisfied = signatureVersion.reduce((acc, entry) => {
        acc = acc && !!objectVersion.find((obj) => signatureMatches(entry, obj));
        return acc;
      }, true);
    } else if ('object' === typeof signatureVersion) {
      keySatisfied = signatureMatches(signatureVersion, objectVersion);
    } else if (key.endsWith('id')) {
      keySatisfied = objectVersion === signatureVersion;
    } else {
      keySatisfied = objectVersion >= signatureVersion;
    }
    if (!keySatisfied) {
      return false;
    }
  }
  return true;
}


/**
 * Repeatedly calls fetcher for up to maxTries until the version signatures are
 * satisfied. Returns the linear list of results from the fetch.
 * @param fetcher
 * @param fetchSignature an array of fetch signatures, where a signature is
 * of the form { id: objectid, sub_object_key:minversion} where the sub object key
 * is the key under which an item resides, and the min version is the minimum version which will
 * satisfy the requirement
 */
async function fetchUntilAllMatched(fetcher, fetchSignatures, maxTries) {
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  let currentTries = 0;

  async function fetchAndMatch(unmatchedSignatures) {
    currentTries += 1;
    const fetched = await fetcher(unmatchedSignatures);
    return signatureMatcher(fetched, unmatchedSignatures);
  }

  let totalMatched = [];
  // the first iteration
  let { matched, unmatchedSignatures } = fetchAndMatch(fetchSignatures);
  totalMatched = totalMatched.concat(matched);
  if (_.isEmpty(unmatchedSignatures)) {
    return totalMatched;
  }
  // the while sleep loop;
  await sleep(FETCH_WAIT_DELAY);
  let result;
  while (currentTries < maxTries) {
    result = fetchAndMatch(unmatchedSignatures);
    matched = result.matched;
    unmatchedSignatures = result.unmatchedSignatures;
    totalMatched = totalMatched.concat(matched);
    if (_.isEmpty(unmatchedSignatures)) {
      return totalMatched;
    }
    await sleep(FETCH_WAIT_DELAY);
  }
  throw new Error('Unable to fetch matching values');
}


/**
 * Given a list of objects that were fetched, and signature definitions returns a new object
 * with two values {
 *   matched: these are the values that have been satisfied
 *   unmatched: these are the values that have _not_ been satisfied
 * }
 * this runs in 0_n^2, so be careful.
 * @param fetched
 * @param signatures
 */
function signatureMatcher(fetched, signatures) {
  const matched = [];
  const matchedSignatures = [];
  for (let x = 0; x < fetched.length; x++) {
    const object = fetched[x];
    const matchingSignature = signatures.find((signature) => signatureMatches(signature, object));
    if (matchingSignature) {
      matched.push(object);
      matchedSignatures.push(object);
    }
  }
  const unmatchedSignatures = _.difference(signatures, matchedSignatures);
  return { matched, unmatchedSignatures };
}

export async function fetchMarketUntilMatched(marketSignature, maxTries= MAX_FETCH_TRIES) {
  const { marketId } = marketSignature;
  const fetcher = () => {
    return getMarketDetails(marketId)
      .then((details) => [details]);
  };
  return fetchUntilAllMatched(fetcher, [marketSignature], maxTries);
}

export async function fetchInvestiblesUntilMatched(marketId, invSignatures, maxTries= MAX_FETCH_TRIES) {
  const fetcher = (unmatchedSignatures) => {
    const idList = unmatchedSignatures.map((sig) => sig.investible.id);
    // this function already chunks stuff, so we don't need to care here
    return fetchInvestibles(idList, marketId);
  };
  return fetchUntilAllMatched(fetcher, invSignatures, maxTries);
}

export async function fetchCommentsUntilMatched(marketId, commentSignatures, maxTries= MAX_FETCH_TRIES) {
  const fetcher = (unmatchedSignatures) => {
    const idList = unmatchedSignatures.map((sig) => sig.id);
    // fetch comments chunks stuff so we don't have to care
    return fetchComments(idList, marketId);
  };
  return fetchUntilAllMatched(fetcher, commentSignatures, maxTries);
}

export async function fetchPresencesUntilMatched(marketId, presenceSignatures, maxTries = MAX_FETCH_TRIES) {
  const fetcher = () => {
    return getMarketUsers(marketId);
  };
  return fetchCommentsUntilMatched(fetcher, presenceSignatures, maxTries);
}
