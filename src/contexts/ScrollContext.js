import React, { useEffect, useLayoutEffect, useState } from 'react'
import { useHistory, useLocation } from 'react-router'
import { decomposeMarketPath } from '../utils/marketIdPathFunctions'

const ScrollContext = React.createContext({});

function ScrollProvider(props) {
  const { children } = props;
  const history = useHistory();
  const location = useLocation();
  const { pathname, hash } = location;
  const [hashFragment, setHashFragment] = useState(undefined);
  const [processedPath, setProcessedPath] = useState(undefined);

  useLayoutEffect(() => {
    // See https://github.com/rafrex/react-router-hash-link/blob/master/src/index.js
    function getElAndScroll(originalScrollTarget) {
      return (mutationsList, observer) => {
        const element = document.getElementById(originalScrollTarget);
        if (element !== null && window.getComputedStyle(element).display !== 'none') {
          if (observer) observer.disconnect()
          const headerOffset = document.getElementById('app-header').offsetHeight + 20;
          const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = elementPosition - headerOffset;
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
          // Remove the hash from the URL so we don't end up scrolling again
          // - use replace instead of push so back button works
          history.replace(window.location.pathname);
          return true;
        }
        return false;
      }
    }

    function hashLinkScroll(myHashFragment) {
      // Push onto callback queue so it runs after the DOM is updated
      // Add 2s to try to get around pictures and long threads asynchronously expanding
      window.setTimeout(() => {
        if (getElAndScroll(myHashFragment)() === false) {
          const myObserver = new MutationObserver(getElAndScroll(myHashFragment));
          myObserver.observe(document, {
            attributes: true,
            childList: true,
            subtree: true,
          });
          // if the element doesn't show up in 10 seconds, stop checking
          window.setTimeout(() => {
            myObserver.disconnect()
          }, 10000)
        }
      }, 1000);
    }

    if (hashFragment) {
      hashLinkScroll(hashFragment)
    }
  }, [hashFragment, history]);

  useEffect(() => {
    const myHashFragment = (hash && hash.length > 1) ? hash.substring(1, hash.length) : undefined;
    if (processedPath !== pathname || hashFragment !== myHashFragment) {
      setProcessedPath(pathname);
      const { action } = decomposeMarketPath(pathname);
      if (!myHashFragment || (action !== 'dialog' && action !== 'dialogArchives' && pathname !== '/'
        && pathname !== '/archives') || hash.includes('onboarded')) {
        //Scroll to the top if its a new page and there is no anchor to scroll to
        if (!hashFragment) {
          window.scrollTo(0, 0);
        }
        setHashFragment(undefined);
      } else {
        setHashFragment(myHashFragment);
      } 
    }
    return () => {
    };
  }, [pathname, hash, processedPath, history, hashFragment]);

  return (
    <ScrollContext.Provider value={hashFragment}>
      {children}
    </ScrollContext.Provider>
  );
}

export { ScrollContext, ScrollProvider };
