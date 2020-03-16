import React, { useEffect, useState, useReducer, useContext } from 'react';
import { toast } from 'react-toastify';
import { useHistory } from 'react-router';
import _ from 'lodash';
import reducer, {
  initializeState,
  NOTIFICATIONS_CONTEXT_NAMESPACE, processedPage,
} from './notificationsContextReducer'
import { deleteMessage } from '../../api/users';
import beginListening from './notificationsContextMessages';
import LocalForageHelper from '../LocalForageHelper';
import { HighlightedCommentContext, HIGHTLIGHT_ADD } from '../HighlightedCommentContext';
import { DiffContext } from '../DiffContext/DiffContext';
import { HighlightedVotingContext } from '../HighlightedVotingContext';
import { hasUnViewedDiff } from '../DiffContext/diffContextHelper';
import { navigate } from '../../utils/marketIdPathFunctions';
import { getFullLink } from '../../components/Notifications/Notifications';
import { ISSUE_TYPE } from '../../constants/notifications'

export const EMPTY_STATE = {
  messages: [],
};

const NotificationsContext = React.createContext(EMPTY_STATE);

export const VISIT_CHANNEL = 'VisitChannel';
export const VIEW_EVENT = 'pageView';

function NotificationsProvider(props) {
  // eslint-disable-next-line react/prop-types
  const { children } = props;
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const { page, messages, lastPage } = state;
  const [diffState] = useContext(DiffContext);
  const [isInitialization, setIsInitialization] = useState(true);
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
            const { current, messages } = state;
            //We don't want to load up page or lastPage from disk
            dispatch(initializeState({current, messages}));
          }
        });
      beginListening(dispatch);
      setIsInitialization(false);
    }
    return () => {
    };
  }, [isInitialization]);

  useEffect(() => {
    if (page) {
      const isOldPage = lastPage !== undefined && _.isEqual(page, lastPage);
      if (_.isEmpty(messages)) {
        if (!isOldPage) {
          console.debug('Processing page with empty messages');
          dispatch(processedPage(page));
        }
      } else {
        const filtered = messages.filter((message) => {
          const { marketId, investibleId, action } = page;
          const {
            marketId: messageMarketId,
            investibleId: messageInvestibleId,
            pokeType,
            beingProcessed,
          } = message;
          const marketMatch = action === 'dialog' && !_.isEmpty(messageMarketId)
            && marketId === messageMarketId && investibleId === messageInvestibleId;
          const isBeingProcessed = _.isEqual(beingProcessed, page);
          console.debug(`is being processed is ${isBeingProcessed} and action ${action}`);
          const doRemove = !isBeingProcessed && (marketMatch ||
            (pokeType === 'slack_reminder' && action === 'notificationPreferences')
            || (pokeType === 'upgrade_reminder' && action === 'upgrade'));
          if (doRemove) {
            message.beingProcessed = page;
          }
          return doRemove;
        });
        if (_.isEmpty(filtered)) {
          return;
        }
        console.debug(`processing old page ${isOldPage}, ${page.marketId}, ${page.investibleId} and ${JSON.stringify(filtered)}`);
        filtered.forEach((message) => {
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
        filtered.sort(function(a, b) {
          if (a.level === b.level) {
            if (a.aType === b.aType || a.level !== 'RED') {
              return 0;
            }
            if (a.aType === ISSUE_TYPE) {
              return -1;
            }
            if (b.aType === ISSUE_TYPE) {
              return 1;
            }
            return 0;
          }
          if (a.level === 'RED') {
            return -1;
          }
          return 1;
        });
        const message = filtered[0];
        deleteMessage(message);
        let toastInfo = {};
        const {
          marketId,
          investibleId,
          text,
          level,
          aType,
          commentId,
        } = message;
        // If there are multiple new RED on this page not much we can do - not a bug tracker
        const multiUpdate = filtered.length > 1 && level !== 'RED';
        // Sadly intl not available here TODO - Fix
        const myText = multiUpdate ? `${filtered.length} Updates` : text;
        const diffId = commentId || investibleId || marketId;
        const linkNotMatching = getFullLink(message) !== `${pathname}${hash}`;
        // Do not toast a non red unread as already have diff and dismiss - unless is new
        // Do toast if the page hasn't changed since will not scroll in that case and need toast if want to scroll
        const shouldToast = (multiUpdate || isOldPage || (!isOldPage && linkNotMatching))
          || (level === 'RED') || (!commentId && (aType !== 'UNREAD' || hasUnViewedDiff(diffState, diffId)));
        const myCustomToastId = myText + '_' + diffId;
        if (shouldToast && !toast.isActive(myCustomToastId)) {
          console.debug('Toasting on page from NotificationsContext');
          const options = {
            onClick: () => navigate(history, getFullLink(message)),
            toastId: myCustomToastId
          }
          toastInfo = { myText, level, options };
        }
        dispatch(processedPage(page, filtered, toastInfo));
      }
    }
    return () => {
    };
  }, [page, messages, diffState, history, lastPage, highlightedCommentDispatch, highlightedVotingDispatch,
    pathname, hash]);

  return (
    <NotificationsContext.Provider value={[state, dispatch]}>
      {children}
    </NotificationsContext.Provider>
  );
}

export { NotificationsContext, NotificationsProvider };
