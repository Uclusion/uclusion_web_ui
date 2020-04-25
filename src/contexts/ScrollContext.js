import React, { useEffect, useLayoutEffect, useState } from 'react'
import { useHistory } from 'react-router'
import { decomposeMarketPath } from '../utils/marketIdPathFunctions'

const ScrollContext = React.createContext({});

function ScrollProvider(props) {
  const { children } = props;
  const history = useHistory();
  const { location } = history;
  const { pathname, hash } = location;
  const [hashFragment, setHashFragment] = useState(undefined);
  const [processedPath, setProcessedPath] = useState(undefined);

  useLayoutEffect(() => {
    // See https://github.com/rafrex/react-router-hash-link/blob/master/src/index.js
    function getElAndScroll(scrollTarget) {
      return (mutationsList, observer) => {
        console.debug(`Got here ${scrollTarget}, ${observer}`);
        const element = document.getElementById(scrollTarget);
        if (element !== null) {
          if (observer) observer.disconnect();
          element.scrollIntoView({ block: 'center' });
          return true;
        }
        return false;
      }
    }

    function hashLinkScroll(myHashFragment) {
      // Push onto callback queue so it runs after the DOM is updated
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
            myObserver.disconnect();
          }, 10000);
        }
      }, 0);
    }
    if (hashFragment) {
      hashLinkScroll(hashFragment);
      setHashFragment(undefined);
    }
  }, [hashFragment]);

  useEffect(() => {
    if (processedPath !== pathname) {
      setProcessedPath(pathname);
      const { action } = decomposeMarketPath(pathname);
      const myHashFragment = (hash && hash.length > 1) ? hash.substring(1, hash.length) : undefined;
      if (!myHashFragment || action !== 'dialog') {
        //Scroll to the top if its a new page and there is no anchor to scroll to
        window.scrollTo(0, 0);
      } else {
        setHashFragment(myHashFragment);
        // Remove the hash from the URL so we don't end up scrolling again
        history.push(pathname);
      } 
    }
    return () => {
    };
  }, [pathname, hash, processedPath, history]);

  return (
    <ScrollContext.Provider value={hashFragment}>
      {children}
    </ScrollContext.Provider>
  );
}

export { ScrollContext, ScrollProvider };
