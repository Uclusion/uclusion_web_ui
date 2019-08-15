import { useContext } from 'react';
import { DrawerContext } from './DrawerContext';


function useDrawerContext() {
  const [state, setState] = useContext(DrawerContext);

  function toggleDrawerOpen(){
    const { open } = state;
    setState({ open: !open });
  }

  return {
    open: state.open,
    toggleDrawerOpen,
  };
}

export default useDrawerContext;
