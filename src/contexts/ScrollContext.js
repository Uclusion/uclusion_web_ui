import React, { useEffect, useLayoutEffect, useState } from 'react'
import { useHistory, useLocation } from 'react-router'
import { decomposeMarketPath, VIEW_EVENT, VISIT_CHANNEL } from '../utils/marketIdPathFunctions';
import { isSignedOut } from '../utils/userFunctions';
import { registerListener } from '../utils/MessageBusUtils';

const ScrollContext = React.createContext({});

export function scrollToElement(element) {
  let headerOffset = document.getElementById('app-header').offsetHeight + 20;
  const investibleHeaderElement = document.getElementById('investible-header');
  if (investibleHeaderElement) {
    // Investible page is not kept when hidden so if in dom we are on that page
    headerOffset += investibleHeaderElement.offsetHeight;
  }
  const dialogHeaderElement = document.getElementById('dialog-header');
  if (dialogHeaderElement) {
    // Dialog page is not kept when hidden so if in dom we are on that page
    headerOffset += dialogHeaderElement.offsetHeight;
  }
  const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
  const offsetPosition = elementPosition - headerOffset;
  window.scrollTo({
    top: offsetPosition,
    behavior: "auto"
  });
}

function ScrollProvider(props) {
  const { children } = props;
  const history = useHistory();
  const location = useLocation();
  const { pathname, search, hash } = location;
  const [hashFragment, setHashFragment] = useState(undefined);
  const [processedPath, setProcessedPath] = useState(undefined);

  useLayoutEffect(() => {
    // See https://github.com/rafrex/react-router-hash-link/blob/master/src/index.js
    function getElAndScroll(originalScrollTarget) {
      return (mutationsList, observer) => {
        const element = document.getElementById(originalScrollTarget);
        if (element !== null && window.getComputedStyle(element).display !== 'none') {
          if (observer) observer.disconnect()
          scrollToElement(element);
          // Remove the hash from the URL so we don't end up scrolling again
          // - use replace instead of push so back button works
          console.info(`Replacing path after scrolling to ${originalScrollTarget}`);
          history.replace(window.location.pathname + window.location.search);
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
            myObserver.disconnect()
          }, 10000)
        }
      }, 0);
    }

    if (hashFragment) {
      hashLinkScroll(hashFragment)
    }
  }, [hashFragment, history]);

  useEffect(() => {
    if (!isSignedOut()) {
      registerListener(VISIT_CHANNEL, 'storedURLHashRefresher', (data) => {
        if (!data) {
          return;
        }
        const { payload: { event } } = data;
        if (event === VIEW_EVENT) {
          setHashFragment(undefined);
        }
      });
    }
    return () => {};
  }, []);

  useEffect(() => {
    const myHashFragment = (hash && hash.length > 1) ? hash.substring(1, hash.length) : undefined;
    if (processedPath !== pathname || hashFragment !== myHashFragment) {
      setProcessedPath(pathname);
      const { action } = decomposeMarketPath(pathname);
      if (!myHashFragment || (!['dialog', 'inbox'].includes(action) && pathname !== '/')) {
        //Scroll to the top if its a new page and there is no anchor to scroll to
        if (!hashFragment) {
          window.scrollTo(0, 0);
        }
      } else if (myHashFragment !== hashFragment) {
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
