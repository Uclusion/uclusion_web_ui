import { getMarketClient } from './marketLogin';
import _ from 'lodash';
import config from '../config';
import { toastErrorAndThrow } from '../utils/userMessage';
import { getAccountClient } from './homeAccount';

/**
 * Upload file to S3
 * @param file the uploaded file
 * @param marketId ID for path to upload to
 */
export function uploadFileToS3 (marketId, file) {
  const clientPromise = _.isEmpty(marketId) ? getAccountClient() : getMarketClient(marketId);
  const { type, size, name } = file;
  // if we don't have a content type, use generic octet stream
  const usedType = _.isEmpty(type)? 'application/octet-stream' : type;
  return clientPromise
    .then((client) => client.investibles.getFileUploadData(usedType, size, name))
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
        .then((response) => {
          if(!response.ok) {
            console.error(response);
            throw response;
          }
          return metadata;
        }); // just want to give back the successful metadata
    }).catch((error) => {
      toastErrorAndThrow(error, 'errorFileUploadFailed');
    });
}

/**
 * Returns a promise containing the s3 file url for the given file
 * @param metadata
 */
export function getS3FileUrl (metadata) {
  const { path } = metadata;
  // // console.log(metadata);
  // since I have the token handy, I might as well update the storage with it;
  // the storage will only update if this token is valid longer than the one it has
  const { baseURL } = config.file_download_configuration;
  const newURL = new URL(path, baseURL);
  return newURL.toString();
}

/**
 * Helper function to determine which of the uploaded files are used in the text body,
 * and to strip out components of the upload that the backend won't accept
 * @param uploadedFiles a data structure with at least a { path } component
 * @param text the body of the context
 * @return a filtered list of file uploads
 */
function filterUploadsUsedInText (uploadedFiles, text) {
  const safeUF = uploadedFiles || [];
  const used = safeUF.filter((file) => {
    const { path } = file;
    return text.includes(path);
  });
  return used.map((element) => {
    const { path, content_type, content_length } = element;
    return { path, content_type, content_length };
  });
}

/**
 * Does all manipulations necessary to make the uploaded files
 * and text safe for saving to the backend
 * @param uploadedFiles
 * @param text
 * @return {{uploadedFiles: *, text: undefined}}
 */
export function processTextAndFilesForSave (uploadedFiles, text) {
  const newUploaded = filterUploadsUsedInText(uploadedFiles, text);
  return { uploadedFiles: newUploaded, text };
}

