import { getMarketClient } from './uclusionClient';
import FileTokenRefresher from '../authorization/FileTokenRefresher';
import TokenManager from '../authorization/TokenManager';
import config from '../config';
import { TOKEN_TYPE_FILE } from '../authorization/TokenStorageManager';
import { updateFileToken } from '../authorization/tokenStorageUtils';

/**
 *
 * @param contentType the content type of the uploaded file
 * @param reader the file reader of the file to be uploaded
 */
export function uploadFileToS3(marketId, file) {
  const { type, size } = file;
  return getMarketClient(marketId)
    .then((client) => client.investibles.getFileUploadData(type, size))
    .then((data) => {
      const { metadata, presigned_post } = data;
      const { url, fields } = presigned_post;
      // load up the fields and file data into the post body
      const body = new FormData();
      for (const [field, value] of Object.entries(fields)) {
        body.append(field, value);
      }
      // aws ignores all fields after the file field, so the data has to be last
      body.append('file', file);
      const fetchParams = { method: 'POST', body };
      return fetch(url, fetchParams)
        .then(() => metadata); // just want to give back the successful metadat
    });
}

/**
 * Returns a promise containg the s3 file url for the given file
 * @param metadata
 */
export function getS3FileUrl(metadata) {
  const { path, uclusion_token } = metadata;
  // console.log(metadata);
  // since I have the token handy, I might as well update the storage with it;
  // the storage will only update if this token is valid longer than the one it has
  if (uclusion_token) {
    updateFileToken(path, uclusion_token);
  }
  // in case our latest token is dead, we'll include a refresher, and ask
  // the storage sybsystem for the latest token we have
  const tokenRefresher = new FileTokenRefresher();
  const tokenManager = new TokenManager(tokenRefresher, null, TOKEN_TYPE_FILE, path);
  const tokenPromise = tokenManager.getToken();
  return tokenPromise.then((token) => {
    const { baseURL } = config.file_download_configuration;
    const newURL = new URL(path, baseURL);
    newURL.searchParams.set('authorization', token);
    return newURL.toString();
  });
}