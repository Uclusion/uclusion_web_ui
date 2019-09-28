import TokenStorageManager from './TokenStorageManager';
import { TOKEN_TYPE_MARKET, TOKEN_TYPE_FILE } from './TokenManager';

export function updateTokensFromMarketList(markets) {
  const storageManager = new TokenStorageManager();
  markets.forEach((market) => {
    const { id, uclusion_token } = market;
    storageManager.storeToken(TOKEN_TYPE_MARKET, id, uclusion_token);
  });
}

export function updateFileTokensFromContext(context) {
  const storageManager = new TokenStorageManager();
  const { uploaded_files } = context;
  uploaded_files.forEach((file) => {
    const { path, uclusion_token } = file;
    storageManager.storeToken(TOKEN_TYPE_FILE, path, uclusion_token);
  });
}

export function updateFileToken(path, token){
  const storageManager = new TokenStorageManager();
  storageManager.storeToken(TOKEN_TYPE_FILE, path, token);
}
