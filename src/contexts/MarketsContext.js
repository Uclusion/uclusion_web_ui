import React, { useState } from 'react';
import { Hub } from 'aws-amplify';
import { getActiveMarkeList } from '../api/sso';
// import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../components/utils';

const MarketsContext = React.createContext([{}, () => {}]);
const AUTH_HUB_CHANNEL = 'auth';
// const LOCAL_STORAGE_KEY = 'markets_context';

function MarketsProvider(props) {

  // const defaultState = [getUclusionLocalStorageItem(LOCAL_STORAGE_KEY), () => {}];
  const defaultState = [{}, () => {}];
  const [state, setState] = useState(defaultState);

 /*
  // persist state locally on change
  useEffect(() => {
    setUclusionLocalStorageItem(LOCAL_STORAGE_KEY, state);
  }, [state]);
*/

  Hub.listen(AUTH_HUB_CHANNEL, (data) => {
    const { payload: { event } } = data;
    console.debug(`Markets context responding to auth event ${event}`);

    switch (event) {
      case 'signIn':
        getActiveMarkeList()
          .then((markets) => {
            setState({ ...state, markets });
          });
        break;
      case 'signOut':
        setState({ ...state, markets: [], currentMarket: null });
        break;
      default:
        console.debug(`Ignoring auth event ${event}`);
    }
  });

  return (
    <MarketsContext.Provider value={[state, setState]} >
      { props.children }
    </MarketsContext.Provider>
  );
}

export { MarketsContext, MarketsProvider };


