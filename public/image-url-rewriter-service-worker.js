const OUR_CLOUDFRONT_FILE_PATTERN = /https\:\/\/\w+.cloudfront.net\/(\w{8}(-\w{4}){3}-\w{12})\/\w{8}(-\w{4}){3}-\w{12}.*/i;
const OUR_CND_DOMAIN_ENDING = 'imagecdn.uclusion.com';
self.importScripts('localforage.min.js');
//see https://davidwalsh.name/service-worker-claim
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
  const urlObj = new URL(url);
//  console.log('Service worker firing');
  if (method === 'GET') {
   // console.log(`Service worker looking for get for url ${url}`;
    // using regexp here in case we ever support outside hosted files
    const match = url.match(OUR_CLOUDFRONT_FILE_PATTERN);
    const cdnMatch = url.includes(OUR_CND_DOMAIN_ENDING);
    if (match || cdnMatch) {
      const pathId = urlObj.pathname.split('/')[1];
      console.log(`PathId ${pathId}`);
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