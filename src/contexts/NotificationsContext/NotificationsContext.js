import React, { useEffect, useState, useReducer, useContext } from 'react';
import { toast } from 'react-toastify';
import { useHistory } from 'react-router';
import _ from 'lodash';
import reducer, {
  initializeState, newToast,
  NOTIFICATIONS_CONTEXT_NAMESPACE, processedPage,
} from './notificationsContextReducer'
import { deleteMessage } from '../../api/users';
import beginListening from './notificationsContextMessages';
import LocalForageHelper from '../LocalForageHelper';
import { AllSequentialMap } from '../../utils/PromiseUtils';
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
  const [diffState, diffDispatch] = useContext(DiffContext);
  const [isInitialization, setIsInitialization] = useState(true);
  const [, highlightedCommentDispatch] = useContext(HighlightedCommentContext);
  const [, highlightedVotingDispatch] = useContext(HighlightedVotingContext);
  const history = useHistory();

  useEffect(() => {
    if (isInitialization) {
      const lfg = new LocalForageHelper(NOTIFICATIONS_CONTEXT_NAMESPACE);
      lfg.getState()
        .then((state) => {
          if (state) {
            dispatch(initializeState(state));
          }
        });
      beginListening(dispatch);
      setIsInitialization(false);
    }
    return () => {
    };
  }, [isInitialization]);

  useEffect(() => {
    if (page && !_.isEmpty(messages)) {
      const isOldPage = _.isEqual(page, lastPage);
      console.debug(`is old page is ${isOldPage}`);
      const filtered = messages.filter((message) => {
        const { marketId, investibleId, action } = page;
        const {
          marketId: messageMarketId,
          investibleId: messageInvestibleId,
          level,
          commentId,
          associatedUserId,
          pokeType,
        } = message;
        const doRemove = (!_.isEmpty(messageMarketId) && marketId === messageMarketId && investibleId === messageInvestibleId)
          || (pokeType === 'slack_reminder' && action === 'notificationPreferences')
          || (pokeType === 'upgrade_reminder' && action === 'upgrade');
        if (doRemove) {
          if (commentId) {
            highlightedCommentDispatch({ type: HIGHTLIGHT_ADD, commentId, level });
          }
          if (associatedUserId) {
            highlightedVotingDispatch({ type: HIGHTLIGHT_ADD, associatedUserId, level });
          }
        }
        return doRemove;
      });
      dispatch(processedPage(page, filtered));
      AllSequentialMap(filtered, (message) => deleteMessage(message));
      const message = filtered.pop();
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
        const myText = filtered.length > 0 ? 'Multiple Updates' : text;
        const diffId = commentId || investibleId || marketId;
        // Do not toast a non red unread as already have diff and dismiss - unless is new
        // Do toast if the page hasn't changed since will not scroll in that case and need toast if want to scroll
        const shouldToast = isOldPage || (level === 'RED') || (!commentId &&
          (aType !== 'UNREAD' || hasUnViewedDiff(diffState, diffId)));
        const myCustomToastId = myText + '_' + diffId;
        if (shouldToast && !toast.isActive(myCustomToastId)) {
          console.debug('Toasting on page from NotificationsContext');
          let toastId = undefined;
          const options = {
            onClick: () => navigate(history, getFullLink(message)),
            toastId: myCustomToastId
          }
          switch (level) {
            case 'RED':
              toastId = toast.error(myText, options);
              break;
            case 'YELLOW':
              toastId = toast.warn(myText, options);
              break;
            default:
              toastId = toast.info(myText, options);
              break;
          }
          if (toastId) {
            dispatch(newToast(toastId))
          }
        }
      }
    }
    return () => {
    };
  }, [page, messages, highlightedCommentDispatch, diffState, diffDispatch, highlightedVotingDispatch, history,
  lastPage]);

  return (
    <NotificationsContext.Provider value={[state, dispatch]}>
      {children}
    </NotificationsContext.Provider>
  );
}

export { NotificationsContext, NotificationsProvider };
