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
          const marketMatch = !_.isEmpty(messageMarketId) && marketId === messageMarketId
            && investibleId === messageInvestibleId;
          const doRemove = (beingProcessed !== page) && (marketMatch ||
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
        console.debug(`old page ${isOldPage}, ${page.marketId}, ${page.investibleId} and ${JSON.stringify(filtered)}`);
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
        const message = filtered[0];
        deleteMessage(message);
        let toastInfo = {};
        if (message) {
          const {
            marketId,
            investibleId,
            text,
            level,
            aType,
            commentId,
          } = message;
          // Sadly intl not available here TODO - Fix
          const multiUpdate = filtered.length > 1;
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
