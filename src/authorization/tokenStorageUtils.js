import TokenStorageManager from './TokenStorageManager';
import { TOKEN_TYPE_MARKET } from './TokenManager';

export function updateTokensFromMarketList(markets) {
  const storageManager = new TokenStorageManager();
  markets.forEach((market) => {
    const { id, uclusion_token } = market;
    storageManager.storeToken(TOKEN_TYPE_MARKET, id, uclusion_token);
  });
}
