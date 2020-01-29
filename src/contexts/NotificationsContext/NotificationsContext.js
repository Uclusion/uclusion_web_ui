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
import { diffSeen } from '../DiffContext/diffContextReducer'

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
    console.debug(page);
    if (page) {
      const filtered = messages.filter((message) => {
        const { marketId, investibleId } = page;
        const {
          marketId: messageMarketId,
          investibleId: messageInvestibleId,
          text,
          level,
          aType,
          commentId,
        } = message;
        const doRemove = marketId === messageMarketId && investibleId === messageInvestibleId;
        if (doRemove) {
          dispatch(removeMessage(message));
          const diffId = commentId || messageInvestibleId || marketId;
          // Do not toast unread as already have diff and dismiss - unless is new
          if (aType !== 'UNREAD' || getIsNew(diffState, diffId)) {
            diffDispatch(diffSeen(diffId));
            if (commentId) {
              highlightedCommentDispatch({ type: HIGHTLIGHT_ADD, commentId, level });
            }
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
  }, [page, messages, highlightedCommentDispatch, diffState, diffDispatch]);

  return (
    <NotificationsContext.Provider value={[state, dispatch]}>
      {children}
    </NotificationsContext.Provider>
  );
}

export { NotificationsContext, NotificationsProvider };
