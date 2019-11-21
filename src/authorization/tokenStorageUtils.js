import TokenStorageManager, { TOKEN_TYPE_FILE, TOKEN_TYPE_MARKET } from './TokenStorageManager';

export function updateFileTokensFromContext(context) {
  const storageManager = new TokenStorageManager();
  const { uploaded_files } = context;
  uploaded_files.forEach((file) => {
    const { path, uclusion_token } = file;
    storageManager.storeToken(TOKEN_TYPE_FILE, path, uclusion_token);
  });
}

export function updateFileToken(path, token) {
  const storageManager = new TokenStorageManager();
  storageManager.storeToken(TOKEN_TYPE_FILE, path, token);
}

export function getStoredFileToken(path) {
  const storageManager = new TokenStorageManager();
  return storageManager.getValidToken(TOKEN_TYPE_FILE, path);
}

export function removeMarketToken(marketId) {
  const storageManager = new TokenStorageManager();
  return storageManager.removeToken(TOKEN_TYPE_MARKET, marketId);
}