import { useContext } from 'react';
import { LocaleContext } from './LocaleContext';


function useLocaleContext() {
  const [state, setState] = useContext(LocaleContext);

  function setLocale(locale){
    setState({ locale });
  }

  return {
    locale: state.locale,
    setLocale,
  };
}

export default useLocaleContext;
