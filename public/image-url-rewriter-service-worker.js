const OUR_FILE_PATTERN = /https\:\/\/\w+.cloudfront.net\/(\w{8}(-\w{4}){3}-\w{12})\/\w{8}(-\w{4}){3}-\w{12}.*/i;
self.importScripts('localforage.min.js');
self.addEventListener('install', (event) => {
  return self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  self.clients.claim();
});
//console.log('Imported localforage');
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const { method, url } = request;
  console.log('Service worker firing');
  if (method === 'GET') {
   // console.log(`Service worker looking for get for url ${url}`);
    const match = url.match(OUR_FILE_PATTERN);
    if (match) {
      const pathId = match[1]; // it's the first capturing group
      const marketKey = `MARKET_${pathId}`;
      const homeAccountKey = 'ACCOUNT_home_account';
      //console.log(`Service worker looking for token ${marketKey}`);
      const promise = self.localforage.createInstance({ storeName: 'TOKEN_STORAGE_MANAGER' }).getItem(marketKey)
        .then((token) => {
          if (token) {
            //console.log(`Service worker found market token ${token}`);
            return token;
          } else {
            //console.log(`Service worker did not find token for ${marketKey} trying home account`);
            return self.localforage.createInstance({ storeName: 'TOKEN_STORAGE_MANAGER' }).getItem(homeAccountKey);
          }
        }).then((token) => {
          if (!token) {
            console.error(`No token for ${url}, ${marketKey} and ${homeAccountKey}`);
            return
          }
          const newUrl = new URL(url);
          newUrl.searchParams.set('authorization', token);
          return fetch(newUrl);
        });
      event.respondWith(promise);
    }
  }
});
//console.log('Listener added');