import uclusion from 'uclusion_sdk';
import AmpifyIdentitySource from '../authorization/AmplifyIdentitySource';
import config from '../config';

export function getMarketLoginInfo(config, marketId){
  return uclusion.constructSSOClient(config).then(client => client.marketLoginInfo(marketId));
}

function getSSOInfo() {
  return new AmpifyIdentitySource().getIdentity()
    .then((idToken) => {
      return uclusion.constructSSOClient(config.api_configuration)
        .then((ssoClient) => {
          return { ssoClient, idToken }
        });
    });
}

export function getActiveMarketList() {
  return getSSOInfo()
    .then((ssoInfo) => {
      const { ssoClient, idToken } = ssoInfo;
      return ssoClient.availableMarkets(idToken, true);
    });
}
