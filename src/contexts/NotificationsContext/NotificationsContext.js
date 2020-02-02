import React, { useEffect, useState, useReducer, useContext } from 'react';
import { toast } from 'react-toastify';
import reducer, {
  initializeState,
  NOTIFICATIONS_CONTEXT_NAMESPACE,
  removeMessage,
} from './notificationsContextReducer';
import { deleteMessage } from '../../api/users';
import beginListening from './notificationsContextMessages';
import LocalForageHelper from '../LocalForageHelper';
import { AllSequentialMap } from '../../utils/PromiseUtils';
import { HighlightedCommentContext, HIGHTLIGHT_ADD } from '../HighlightedCommentContext';
import { DiffContext } from '../DiffContext/DiffContext';
import { getIsNew } from '../DiffContext/diffContextHelper';
import { diffSeen } from '../DiffContext/diffContextReducer';
import { HighlightedVotingContext } from '../HighlightedVotingContext';
import { VersionsContext } from '../VersionsContext/VersionsContext';

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
          text,
          level,
          aType,
          commentId,
          associatedUserId,
          pokeType,
        } = message;
        const doRemove = (marketId === messageMarketId && investibleId === messageInvestibleId)
          || (pokeType === 'slack_reminder' && action === 'notificationPreferences');
        if (doRemove) {
          dispatch(removeMessage(message));
          const diffId = commentId || messageInvestibleId || marketId;
          if (commentId) {
            highlightedCommentDispatch({ type: HIGHTLIGHT_ADD, commentId, level });
          }
          if (associatedUserId) {
            highlightedVotingDispatch({ type: HIGHTLIGHT_ADD, associatedUserId, level });
          }
          // Do not toast unread as already have diff and dismiss - unless is new
          if (aType !== 'UNREAD' || getIsNew(diffState, diffId)) {
            diffDispatch(diffSeen(diffId));
            console.debug('Toasting from NotificationsContext');
            switch (level) {
              case 'RED':
                toast.error(text);
                break;
              case 'YELLOW':
                if (!commentId) {
                  toast.warn(text);
                }
                break;
              default:
                toast.info(text);
                break;
            }
          }
        }
        return doRemove;
      });
      AllSequentialMap(filtered, (message) => deleteMessage(message));
    }
    return () => {
    };
  }, [page, messages, highlightedCommentDispatch, diffState, diffDispatch, highlightedVotingDispatch]);

  return (
    <NotificationsContext.Provider value={[state, dispatch]}>
      {children}
    </NotificationsContext.Provider>
  );
}

export { NotificationsContext, NotificationsProvider };
