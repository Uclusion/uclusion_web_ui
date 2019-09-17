/**
 *
 * @param contentType the content type of the uploaded file
 * @param reader the file reader of the file to be uploaded
 */
import { getMarketClient } from './uclusionClient';

function getContentPromise(file) {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    const loadHandler = reader.addEventListener('load', () => {
      resolve(reader.result);
    });
    const errorHandler = reader.addEventListener('error', () => {
      reject(reader.error);
    });
    reader.readAsBinaryString(file);
  });
}

export function uploadFileToS3(marketId, file) {
  console.log(file);
  return getContentPromise(file)
    .then((buffer) => {
      return getMarketClient(marketId)
        .then(client => client.investibles.createFileUploadDestination(file.type, file.size))
        .then((destination) => {
          const { url, fields } = destination;
          // load up the fields and file data into the post body
          const body = new FormData();
          for (const [field, value] of Object.entries(fields)) {
            body.append(field, value);
          }
          // aws ignores all fields after the file field, so the data has to be last
          body.append('file', file);
          const fetchParams = { method: 'POST', body };
          return fetch(url, fetchParams)
            .then(() => url); // just want to give back the successful url
        });
    });
}

