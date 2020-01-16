import { getMarketClient } from './uclusionClient';
import FileTokenRefresher from '../authorization/FileTokenRefresher';
import TokenFetcher from '../authorization/TokenFetcher';
import config from '../config';
import { TOKEN_TYPE_FILE } from '../authorization/TokenStorageManager';
import { getStoredFileToken, updateFileToken } from '../authorization/tokenStorageUtils';
import { toastErrorAndThrow } from '../utils/userMessage';

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
    })
    .catch(() => {
      toastErrorAndThrow('errorFileUploadFailed');
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
  const tokenManager = new TokenFetcher(tokenRefresher, null, TOKEN_TYPE_FILE, path);
  const tokenPromise = tokenManager.getToken();
  return tokenPromise.then((token) => {
    const { baseURL } = config.file_download_configuration;
    const newURL = new URL(path, baseURL);
    newURL.searchParams.set('authorization', token);
    return newURL.toString();
  });
}

/**
 * Helper function to determine which of the uploaded files are used in the text body,
 * and to strip out components of the upload that the backend won't accept
 * @param uploadedFiles a data structure with at least a { path } component
 * @param text the body of the context
 * @return a filtered list of file uploads
 */
function filterUploadsUsedInText(uploadedFiles, text) {
  const used = uploadedFiles.filter((file) => {
    const { path } = file;
    return text.includes(path);
  });
  return used.map((element) => {
    const { path, content_type, content_length } = element;
    return { path, content_type, content_length };
  });
}

function removeUploadedFileTokens(text) {
  const ourBaseURL = config.file_download_configuration.baseURL;
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = text;
  const imageTags = tempDiv.getElementsByTagName('img');
  for (let x = 0; x < imageTags.length; x += 1) {
    const img = imageTags[x];
    const { src } = img;
    if (src.startsWith(ourBaseURL)) {
      const url = new URL(src);
      url.searchParams.delete('authorization');
      img.setAttribute('src', url.toString());
    }
  }
  return tempDiv.innerHTML;
}

/** Processes the body of the text, and replaces any authorization tokens
 * in image sources with the latest tokens we have. Note, this function will
 * NOT refresh the file tokens, so you might get broken images
 * @param uploadedFiles
 * @param text
 * @return {Promise<unknown>|Promise<string>}
 */
export function fixUploadedFileLinks(text) {
  const ourBaseURL = config.file_download_configuration.baseURL;
  // create temp doc element to allow us to extract the images
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = text;
  const imageTags = tempDiv.getElementsByTagName('img');
  for (let x = 0; x < imageTags.length; x += 1) {
    const img = imageTags[x];
    const { src } = img;
    if (src.startsWith(ourBaseURL)) {
      const url = new URL(img.src);
      const { pathname } = url;
      if (pathname.length > 0) {
        const path = pathname.startsWith('/') ? pathname.substr(1, pathname.length) : pathname;
        console.debug(path);
        const token = getStoredFileToken(path);
        if (token) {
          url.searchParams.set('authorization', token);
          img.setAttribute('src', url.toString());
        }
      }
    }
  }
  return tempDiv.innerHTML;
}

/**
 * Does all manipulations necessary to make the uploaded files
 * and text safe for saving to the backend
 * @param uploadedFiles
 * @param text
 * @return {{uploadedFiles: *, text: undefined}}
 */
export function processTextAndFilesForSave(uploadedFiles, text) {
  const newUploaded = filterUploadsUsedInText(uploadedFiles, text);
  const newText = removeUploadedFileTokens(text);
  return { uploadedFiles: newUploaded, text: newText };
}
