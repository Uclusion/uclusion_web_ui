const OUR_FILE_PATTERN = /https\:\/\/\w+.cloudfront.net\/(\w{8}(-\w{4}){3}-\w{12})\/\w{8}(-\w{4}){3}-\w{12}.*/i;
self.importScripts('localforage.min.js');
self.addEventListener('fetch', (event) => {
  console.log('Got new fetch');
  const { request } = event;
  const { method, url } = request;
  console.log(method);
  if (method === 'GET') {
    const match = url.match(OUR_FILE_PATTERN);
    if (match) {
      const pathId = match[1]; // it's the first capturing group
      const promise = self.localforage.getItem('TOKEN_STORAGE_MANAGER')
        .then((tokens) => {
          const marketTokens = tokens['MARKET'];
          const accountTokens = tokens['ACCOUNT'];
          let myToken = marketTokens[pathId];
          // if we don't have a market token, fall back to an account
          // as market creation uses account tokens for image uploads
          if (!myToken) {
            myToken = accountTokens['home_account']; // we'll try our home account
          }
          // if we still don't have a token, bail
          if (!myToken) {
            throw "No authorization for image" + url;
          }
          const newUrl = new URL(url);
          newUrl.searchParams.set('authorization', myToken);
          return fetch(newUrl);
        });
      event.respondWith(promise);
    }
  }

});