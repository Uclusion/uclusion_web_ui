import React, { useEffect, useLayoutEffect, useState } from 'react'
import { useHistory, useLocation } from 'react-router'
import { decomposeMarketPath, removeHash, VIEW_EVENT, VISIT_CHANNEL } from '../utils/marketIdPathFunctions';
import { isSignedOut } from '../utils/userFunctions';
import { registerListener } from '../utils/MessageBusUtils';

const ScrollContext = React.createContext({});

export function scrollToElement(element) {
  // TODO this won't work on Firefox but is so far the only solution
  element.scrollIntoViewIfNeeded();
}

function ScrollProvider(props) {
  const { children } = props;
  const history = useHistory();
  const location = useLocation();
  const { pathname, hash } = location;
  const [hashFragment, setHashFragment] = useState(undefined);
  const [processedPath, setProcessedPath] = useState(undefined);
  const [noHighlightId, setNoHighlightId] = useState(undefined);

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
          removeHash(history);
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
    registerListener(VISIT_CHANNEL, 'storedURLHashRefresher', (data) => {
      if (!data || isSignedOut()) {
        return;
      }
      const { payload: { event, message: { isEntry } } } = data;
      if (event === VIEW_EVENT && isEntry === false) {
        // use isEntry false to make sure not clearing these on initial page load
        setHashFragment(undefined);
        setNoHighlightId(undefined);
      }
    });
    return () => {};
  }, []);

  useEffect(() => {
    const myHashFragment = (hash && hash.length > 1) ? hash.substring(1, hash.length) : undefined;
    if (processedPath !== pathname || hashFragment !== myHashFragment) {
      setProcessedPath(pathname);
      const { action } = decomposeMarketPath(pathname);
      if (!myHashFragment || (!['dialog', 'inbox', 'comment'].includes(action) && pathname !== '/')) {
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
    <ScrollContext.Provider value={[hashFragment, noHighlightId, setNoHighlightId]}>
      {children}
    </ScrollContext.Provider>
  );
}

export { ScrollContext, ScrollProvider };
