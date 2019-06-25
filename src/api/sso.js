import uclusion from 'uclusion_sdk';

export function getMarketLoginInfo(config, marketId){
  return uclusion.constructSSOClient(config).then(client => client.marketLoginInfo(marketId));
}

