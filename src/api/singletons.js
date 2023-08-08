/*
The token storage manager is a singleton because it all loops back to local storage anyway
 */

import TokenStorageManager from '../authorization/TokenStorageManager';
import AmplifyIdentityTokenRefresher from '../authorization/AmplifyIdentityTokenRefresher';
import client from 'uclusion_sdk';
import config from '../config';
import MarketTokenFetcher from '../authorization/MarketTokenFetcher';
import { TOKEN_TYPE_MARKET } from './tokenConstants';



let tsm = null;
export function getTokenStorageManager(){
  if(tsm == null){
    tsm = new TokenStorageManager();
  }
  return tsm;
}

export const AMPLIFY_IDENTITY_SOURCE = new AmplifyIdentityTokenRefresher();
export const SSO_CLIENT = client.getResolvedSSOClient(config.api_configuration);


export const ALL_MARKET_TOKEN_FETCHER = new MarketTokenFetcher(AMPLIFY_IDENTITY_SOURCE, SSO_CLIENT, TOKEN_TYPE_MARKET);
