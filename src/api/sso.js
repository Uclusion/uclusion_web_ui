import uclusion from 'uclusion_sdk';
import AmpifyIdentitySource from '../authorization/AmplifyIdentitySource';
import config from '../config';
import { updateTokensFromMarketList } from '../authorization/tokenStorageUtils';

export function getMarketLoginInfo(config, marketId) {
  return uclusion.constructSSOClient(config).then(client => client.marketLoginInfo(marketId));
}

function getSSOInfo() {
  return new AmpifyIdentitySource().getIdentity()
    .then((idToken) => {
      return uclusion.constructSSOClient(config.api_configuration)
        .then((ssoClient) => {
          return { ssoClient, idToken };
        });
    });
}

export function getMarketList() {
  return getSSOInfo()
    .then((ssoInfo) => {
      const { ssoClient, idToken } = ssoInfo;
      // as a side effect, whenever we get the active market list, we'll update the
      // authorization tokens contained inside, since it's free
      return ssoClient.availableMarkets(idToken, true)
        .then((markets) => {
          console.debug('Got markets');
          console.debug(markets);
          updateTokensFromMarketList(markets);
          return markets;
        });
    });
}
