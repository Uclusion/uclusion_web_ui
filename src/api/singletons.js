/*
The token storage manager is a singleton because it all loops back to local storage anyway
 */

import TokenStorageManager from '../authorization/TokenStorageManager';



let tsm = null;

export function getTokenStorageManager(){
  if(tsm == null){
    tsm = new TokenStorageManager();
  }
  return tsm;
}