import client from 'uclusion_sdk'
import config from './config'


export const getClient = () => {
  const ucClient = client.constructClient(config.api_configuration)
  return ucClient;
}