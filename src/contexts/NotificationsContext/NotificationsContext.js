import React, { useEffect, useState, useReducer, useContext } from 'react';
import { toast } from 'react-toastify';
import { useHistory } from 'react-router';
import _ from 'lodash';
import reducer, {
  initializeState, newToast,
  NOTIFICATIONS_CONTEXT_NAMESPACE,
  removeMessage,
} from './notificationsContextReducer';
import { deleteMessage } from '../../api/users';
import beginListening from './notificationsContextMessages';
import LocalForageHelper from '../LocalForageHelper';
import { AllSequentialMap } from '../../utils/PromiseUtils';
import { HighlightedCommentContext, HIGHTLIGHT_ADD } from '../HighlightedCommentContext';
import { DiffContext } from '../DiffContext/DiffContext';
import { HighlightedVotingContext } from '../HighlightedVotingContext';
import { VersionsContext } from '../VersionsContext/VersionsContext';
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
  const { page, messages } = state;
  const [diffState, diffDispatch] = useContext(DiffContext);
  const [isInitialization, setIsInitialization] = useState(true);
  const [, highlightedCommentDispatch] = useContext(HighlightedCommentContext);
  const [, highlightedVotingDispatch] = useContext(HighlightedVotingContext);
  const [, versionsDispatch] = useContext(VersionsContext);
  const history = useHistory();

  useEffect(() => {
    if (isInitialization && versionsDispatch) {
      const lfg = new LocalForageHelper(NOTIFICATIONS_CONTEXT_NAMESPACE);
      lfg.getState()
        .then((state) => {
          if (state) {
            dispatch(initializeState(state));
          }
        });
      beginListening(dispatch, versionsDispatch);
      setIsInitialization(false);
    }
    return () => {
    };
  }, [isInitialization, versionsDispatch]);

  useEffect(() => {
    console.debug(page);
    if (page) {
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
          dispatch(removeMessage(message));
          if (commentId) {
            highlightedCommentDispatch({ type: HIGHTLIGHT_ADD, commentId, level });
          }
          if (associatedUserId) {
            highlightedVotingDispatch({ type: HIGHTLIGHT_ADD, associatedUserId, level });
          }
        }
        return doRemove;
      });
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
        const shouldToast = (level === 'RED') || aType !== 'UNREAD' || hasUnViewedDiff(diffState, diffId);
        if (shouldToast) {
          console.debug('Toasting from NotificationsContext');
          let toastId = undefined;
          const options = {
            onClick: () => navigate(history, getFullLink(message))
          }
          switch (level) {
            case 'RED':
              toastId = toast.error(myText, options);
              break;
            case 'YELLOW':
              if (!commentId) {
                toastId = toast.warn(myText, options);
              }
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
  }, [page, messages, highlightedCommentDispatch, diffState, diffDispatch, highlightedVotingDispatch, history]);

  return (
    <NotificationsContext.Provider value={[state, dispatch]}>
      {children}
    </NotificationsContext.Provider>
  );
}

export { NotificationsContext, NotificationsProvider };
