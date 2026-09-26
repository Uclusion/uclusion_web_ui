import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router';
import { ASSIGNED_HASH, BACKLOG_HASH, decomposeMarketPath, DISCUSSION_HASH, removeHash } from '../utils/marketIdPathFunctions';

const ScrollContext = React.createContext({});

export function scrollToElement(element) {
  if (element.id.includes('header')) {
    // Use hash to guarantee the page is rendered before scrolling
    // So far only done for investible and probably not necessary as removing height 100% from index.html fixed
    window.scrollTo(0, 0);
  } else {
    if (element.scrollIntoViewIfNeeded) {
      // TODO this won't work on Firefox but is so far the only solution
      element.scrollIntoViewIfNeeded();
    } else {
      element.scrollIntoView();
    }
  }
}

function ScrollProvider(props) {
  const { children } = props;
  const history = useHistory();
  const location = useLocation();
  const { pathname, hash } = location;
  const notificationEntryId = location.state?.notification?.entryId;
  const [scrollTarget, setScrollTarget] = useState();
  const [hashFragment, setHashFragment] = useState();
  const processedPath = useRef();
  const [noHighlightId, setNoHighlightId] = useState(undefined);

  useLayoutEffect(() => {
    if (!scrollTarget) return undefined;
    let observer;
    let observerTimeout;
    let highlightTimeout;
    function scrollIfVisible() {
      const current = history.location;
      if (current.pathname !== scrollTarget.pathname || current.hash !== `#${scrollTarget.fragment}` ||
        current.state?.notification?.entryId !== scrollTarget.entryId) return false;
      const element = document.getElementById(scrollTarget.fragment);
      if (!element || element.getClientRects().length === 0) return false;
      observer?.disconnect();
      window.clearTimeout(observerTimeout);
      scrollToElement(element);
      // Highlight only once the actual destination is visible, as after creation.
      setHashFragment(scrollTarget.fragment);
      highlightTimeout = window.setTimeout(() => {
        setScrollTarget(undefined);
        setHashFragment(undefined);
        setNoHighlightId(undefined);
      }, 2000);
      removeHash(history);
      return true;
    }
    const scrollTimeout = window.setTimeout(() => {
      if (!scrollIfVisible()) {
        observer = new MutationObserver(scrollIfVisible);
        observer.observe(document, { attributes: true, childList: true, subtree: true });
        observerTimeout = window.setTimeout(() => {
          observer.disconnect();
          setScrollTarget(undefined);
        }, 10000);
      }
    }, 0);
    // A second entry, including the same anchor, owns a fresh two-second highlight.
    return () => {
      observer?.disconnect();
      window.clearTimeout(scrollTimeout);
      window.clearTimeout(observerTimeout);
      window.clearTimeout(highlightTimeout);
    };
  }, [scrollTarget, history]);

  useEffect(() => {
    const newPage = processedPath.current !== pathname;
    processedPath.current = pathname;
    if ([`#${ASSIGNED_HASH}`, `#${BACKLOG_HASH}`, `#${DISCUSSION_HASH}`].includes(hash)) return;
    const fragment = hash?.substring(1);
    const { action } = decomposeMarketPath(pathname);
    if (fragment && (['dialog', 'inbox', 'comment'].includes(action) || pathname === '/')) {
      setHashFragment(undefined);
      setNoHighlightId(undefined);
      setScrollTarget({ fragment, pathname, entryId: notificationEntryId });
    } else if (newPage) {
      setScrollTarget(undefined);
      setHashFragment(undefined);
      setNoHighlightId(undefined);
      window.scrollTo(0, 0);
    }
    // Removing the URL hash after scrolling keeps its highlight until the timer expires.
  }, [pathname, hash, notificationEntryId]);

  return (
    <ScrollContext.Provider value={[hashFragment, noHighlightId, setNoHighlightId]}>
      {children}
    </ScrollContext.Provider>
  );
}

export { ScrollContext, ScrollProvider };
