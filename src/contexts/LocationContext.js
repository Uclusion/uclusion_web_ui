import React, { useState, useEffect } from 'react';
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../components/utils';

const LocationContext = React.createContext([{}, () => {}]);

const LOCATION_CONTEXT_KEY = 'location_context';

function LocationProvider(props) {

  const { children } = props;
  const defaultValue = getUclusionLocalStorageItem(LOCATION_CONTEXT_KEY) || { location: '/dialogs' };
  const [state, setState] = useState(defaultValue);

  useEffect(() => {
    setUclusionLocalStorageItem(LOCATION_CONTEXT_KEY, state);
  }, [state]);

  return (
    <LocationContext.Provider value={[state, setState]}>
      { children }
    </LocationContext.Provider>
  );
}

export { LocationContext, LocationProvider };
