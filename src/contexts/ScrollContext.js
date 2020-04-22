import React, { useEffect, useLayoutEffect, useState } from 'react'
import { useHistory } from 'react-router'

const ScrollContext = React.createContext({});

function ScrollProvider(props) {
  const { children } = props;
  const history = useHistory();
  const { location } = history;
  const { pathname, hash } = location;
  const [hashFragment, setHashFragment] = useState(undefined);
  const [asyncTimerId, setAsyncTimerId] = useState(undefined);
  const [observer, setObserver] = useState(undefined);
  const [scrollTarget, setScrollTarget] = useState(undefined);
  const [processedPath, setProcessedPath] = useState(undefined);

  useLayoutEffect(() => {
    // See https://github.com/rafrex/react-router-hash-link/blob/master/src/index.js
    function reset(full) {
      if (observer) observer.disconnect();
      if (asyncTimerId) {
        window.clearTimeout(asyncTimerId);
        setAsyncTimerId(undefined);
      }
      if (full) {
        setHashFragment(undefined);
        setScrollTarget(undefined);
      }
    }

    function getElAndScroll() {
      const element = document.getElementById(hashFragment);
      if (element !== null) {
        element.scrollIntoView({block: 'center'});
        reset(true);
        return true;
      }
      return false;
    }

    function hashLinkScroll() {
      // Push onto callback queue so it runs after the DOM is updated
      window.setTimeout(() => {
        if (getElAndScroll() === false) {
          const myObserver = new MutationObserver(getElAndScroll);
          myObserver.observe(document, {
            attributes: true,
            childList: true,
            subtree: true,
          });
          setObserver(myObserver);
          // if the element doesn't show up in 10 seconds, stop checking
          const myAsyncTimerId = window.setTimeout(() => {
            reset(true);
          }, 10000);
          setAsyncTimerId(myAsyncTimerId);
        }
      }, 0);
    }
    if (hashFragment && hashFragment !== scrollTarget) {
      setScrollTarget(hashFragment);
      reset(false);
      hashLinkScroll();
    }
  }, [asyncTimerId, hashFragment, observer, scrollTarget]);

  useEffect(() => {
    if (processedPath !== pathname) {
      setProcessedPath(pathname);
      const myHashFragment = (hash && hash.length > 1) ? hash.substring(1, hash.length) : undefined;
      if (!myHashFragment) {
        //Scroll to the top if its a new page and there is no anchor to scroll to
        window.scrollTo(0, 0);
      } else {
        setHashFragment(myHashFragment);
      } 
    }
    return () => {
    };
  }, [pathname, hash, processedPath]);

  return (
    <ScrollContext.Provider value={hashFragment}>
      {children}
    </ScrollContext.Provider>
  );
}

export { ScrollContext, ScrollProvider };
