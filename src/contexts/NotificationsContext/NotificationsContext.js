import React, { useContext, useEffect, useLayoutEffect, useReducer, useState } from 'react';
import { toast } from 'react-toastify';
import { useHistory } from 'react-router';
import _ from 'lodash';
import reducer, {
  initializeState,
  isMessageEqual,
  NOTIFICATIONS_CONTEXT_NAMESPACE,
  pageIsEqual,
  processedPage,
} from './notificationsContextReducer';

import beginListening from './notificationsContextMessages';
import LocalForageHelper from '../../utils/LocalForageHelper';
import { HighlightedCommentContext, HIGHTLIGHT_ADD } from '../HighlightedCommentContext';
import { DiffContext } from '../DiffContext/DiffContext';
import { HighlightedVotingContext } from '../HighlightedVotingContext';
import { hasUnViewedDiff } from '../DiffContext/diffContextHelper';
import { navigate } from '../../utils/marketIdPathFunctions';
import { getFullLink } from '../../components/Notifications/Notifications';
import { messageComparator } from '../../utils/messageUtils';


export const EMPTY_STATE = {
  initializing: true,
  messages: [],
};

const NotificationsContext = React.createContext(EMPTY_STATE);

export const VISIT_CHANNEL = 'VisitChannel';
export const VIEW_EVENT = 'pageView';

function NotificationsProvider (props) {
  // eslint-disable-next-line react/prop-types
  const { children } = props;
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const { page, messages, lastPage } = state;
  const [diffState] = useContext(DiffContext);
  const [isInitialization, setIsInitialization] = useState(true);
  const [currentlyProcessingPage, setCurrentlyProcessingPage] = useState(undefined);
  const [, highlightedCommentDispatch] = useContext(HighlightedCommentContext);
  const [, highlightedVotingDispatch] = useContext(HighlightedVotingContext);
  const history = useHistory();
  const { location } = history;
  const { pathname, hash } = location;
  useEffect(() => {
    if (isInitialization) {
      const lfg = new LocalForageHelper(NOTIFICATIONS_CONTEXT_NAMESPACE);
      lfg.getState()
        .then((state) => {
          if (state) {
            const { messages } = state;
            //We don't want to load up page or lastPage from disk
            dispatch(initializeState({ messages }));
          }
        });
      beginListening(dispatch);
      setIsInitialization(false);
    }
    return () => {
    };
  }, [isInitialization]);



  useLayoutEffect(() => {
    // First some useful helper functions
    function getMessagesForPage () {
      return messages.filter((message) => {
        const { marketId, investibleId, action, beingProcessed } = page;
        const {
          marketId: messageMarketId,
          investibleId: messageInvestibleId,
          pokeType,
        } = message;
        const marketMatch = action === 'dialog' && !_.isEmpty(messageMarketId)
          && marketId === messageMarketId && investibleId === messageInvestibleId;
        const processedMessage = (beingProcessed || []).find((processing) => isMessageEqual(message, processing));
        const isBeingProcessed = !_.isEmpty(processedMessage);
        // We would like to guarantee that we don't process the same messages twice but it is difficult
        const doRemove = !isBeingProcessed && (marketMatch ||
          (pokeType === 'slack_reminder' && action === 'notificationPreferences')
          || (pokeType === 'upgrade_reminder' && action === 'upgrade'));
        if (doRemove) {
          if (!beingProcessed) {
            page.beingProcessed = [];
          }
          page.beingProcessed.push(message);
        }
        return doRemove;
      });
    }

    function newUserMessageProcessed() {
      const newUserMessage = messages.find((massagedMessage) => massagedMessage.pokeType === 'new_user');
      if (newUserMessage) {
        if (pathname === '/') {
          // This is a new user going to home page but we need to redirect
          navigate(history, '/dialogAdd#type=PLANNING');
          return true;
        } else {
          const { marketId, action } = page;
          let removeNewUserNotification = false;
          if (marketId) {
            // This user is coming in on a market invite
            removeNewUserNotification = true;
          } else if (action === 'dialogAdd') {
            // This new user reached the dialog add page successfully so delete this message
            // Otherwise they might click on the notification in the tray when already where supposed to be
            removeNewUserNotification = true;
          }
          if (removeNewUserNotification) {
            dispatch(processedPage(page, [newUserMessage], {}));
            return true;
          }
        }
      }
      return false;
    }

    function processMessageHighlights(pageMessages) {
      // Set up the highlights based on the page messages
      pageMessages.forEach((message) => {
        const {
          level,
          commentId,
          associatedUserId,
        } = message;
        if (commentId) {
          highlightedCommentDispatch({ type: HIGHTLIGHT_ADD, commentId, level });
        }
        if (associatedUserId) {
          highlightedVotingDispatch({ type: HIGHTLIGHT_ADD, associatedUserId, level });
        }
      });
    }

    if (_.isEmpty(page)) {
      // if we don't have any page info then we can't do anything
      return;
    }
    const onSamePageAsLastProcess = lastPage !== undefined && pageIsEqual(page, lastPage);
    // If last page and page are equal then we last processed this page and consider the user as already reading it
    // we'll need to update the process time for the page to the current time
    page.lastProcessed = Date.now();
    const scrollTarget = (hash && hash.length > 1) ? hash.substring(1, hash.length) : undefined;
    if (!onSamePageAsLastProcess && !scrollTarget) {
      //Scroll to the top if its a new page and there is no anchor to scroll to
      window.scrollTo(0, 0);
    }
    if (_.isEmpty(messages)) {
      if (!onSamePageAsLastProcess) {
        // If there are no new messages on a new page then just scroll and mark old
        dispatch(processedPage(page, undefined, undefined, true, scrollTarget));
      }
      // if we've no messages, then we have nothing new to do
      return;
    }
    // if the message we just processed was a new user message, then we
    // need to process that and stop processing for this run
    const wasNewUserMessage = newUserMessageProcessed();
    if (wasNewUserMessage) {
      return;
    }

    const pageMessages = getMessagesForPage();
    if (_.isEmpty(pageMessages)) {
      // if we don't have any messages for this page, and we've not already processed this page
      // tell the store that we've landed here
      if (!onSamePageAsLastProcess) {
        dispatch(processedPage(page, undefined, undefined, true, scrollTarget));
      }
      return;
    }
    // let the context know we're working on this page
    setCurrentlyProcessingPage(page);
    //If you've been on the page less than 3s count page process new for the purposes of new messages in this page
    const pageChangedRecently = !onSamePageAsLastProcess || (onSamePageAsLastProcess && (Date.now() - page.lastProcessed > 3000));
    // do all the highlighting
    processMessageHighlights(pageMessages);
    // sort the messages so we toast them in the right order
    pageMessages.sort(messageComparator);
    // We only allow single messages to be linked
    // and we only need one message to tell the delete API what page we are on
    // so it can delete all messages associated with that page.
    // Therefore we'll use the first message as representative
    const message = pageMessages[0];
    const messageLink = getFullLink(message);
    let toastInfo = {};
    const {
      marketId,
      investibleId,
      text,
      level,
      aType,
      commentId,
    } = message;
    // due to the sort above we're guaranteed that if the message is NOT red, than neither are any other
    // messages in the page messages
    const messageIsRed = level === 'RED';
    // If there are multiple new RED on this page not much we can do - not a bug tracker
    const shouldCollapseMessages = !messageIsRed && pageMessages.length > 1;
    // Sadly intl not available here TODO - Fix
    const myText = shouldCollapseMessages ? `${pageMessages.length} Updates` : text;
    const diffId = investibleId || marketId; // we don't diff comments
    // get the object ID this message pertains to
    const objectId = commentId || investibleId || marketId;
    const messageIsForDifferentPage = messageLink !== `${pathname}${hash}`;
    // there will be no diff if this message is for a comment, otherwise, go looking for an unviewed
    // as we do not toast a non red unread as already have diff and dismiss - unless is new
    const diffAvailable = (!commentId && (aType !== 'UNREAD' || hasUnViewedDiff(diffState, diffId)));
    // Do toast if the page hasn't changed since will not scroll in that case and need toast if want to scroll
    const shouldToast = (shouldCollapseMessages || pageChangedRecently || (!pageChangedRecently && messageIsForDifferentPage))
      || messageIsRed || diffAvailable;
    const myCustomToastId = myText + '_' + objectId;
    // if we have a toast up already for this object and text, do nothing
    if (shouldToast && !toast.isActive(myCustomToastId)) {
      //Tell the notifications reducer what to do but only do it inside the dispatch for fear of processing twice
      const options = {
        onClick: () => navigate(history, messageLink),
        toastId: myCustomToastId
      };
      toastInfo = { myText, level, options };
    }
    dispatch(processedPage(page, pageMessages, toastInfo, !pageChangedRecently, scrollTarget));

    return () => {
    };
  }, [
    page, messages, diffState, history, lastPage, highlightedCommentDispatch, highlightedVotingDispatch,
    pathname, hash, currentlyProcessingPage
  ]);

  return (
    <NotificationsContext.Provider value={[state, dispatch]}>
      {children}
    </NotificationsContext.Provider>
  );
}

export { NotificationsContext, NotificationsProvider };
