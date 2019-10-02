import { useContext } from 'react';
import { LocationContext } from './LocationContext';


function useLocationContext() {
  const [state, setState] = useContext(LocationContext);

  function setLocation(location){
    setState({location});
  }

  function getLocation(){
    const {location} = state;
    return location;
  }
  return {
    getLocation,
    setLocation,
  };
}

export default useLocationContext;
