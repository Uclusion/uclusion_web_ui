import { getMarketClient, getFileClient } from './uclusionClient';

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
      const fetchParams = { method: 'POST', body, mode: 'no-cors' };
      return fetch(url, fetchParams)
        .then(() => metadata); // just want to give back the successful url
    });
}

export function fetchFileFromS3(metadata) {
  const { path } = metadata;
  return getFileClient(metadata)
    .then((client) => client.files.fetchFile(path));
}
