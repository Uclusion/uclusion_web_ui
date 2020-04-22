import React, { useContext, useEffect, useReducer, useState } from 'react'
import { toast } from 'react-toastify'
import { useHistory } from 'react-router'
import _ from 'lodash'
import reducer, {
  initializeState,
  isMessageEqual,
  NOTIFICATIONS_CONTEXT_NAMESPACE,
  pageIsEqual,
  processedPage,
} from './notificationsContextReducer'

import beginListening from './notificationsContextMessages'
import LocalForageHelper from '../../utils/LocalForageHelper'
import { HighlightedCommentContext, HIGHTLIGHT_ADD } from '../HighlightedCommentContext'
import { DiffContext } from '../DiffContext/DiffContext'
import { HighlightedVotingContext } from '../HighlightedVotingContext'
import { hasUnViewedDiff } from '../DiffContext/diffContextHelper'
import { navigate } from '../../utils/marketIdPathFunctions'
import { getFullLink } from '../../components/Notifications/Notifications'
import { messageComparator } from '../../utils/messageUtils'

export const EMPTY_STATE = {
  initializing: true,
  messages: [],
};

const NotificationsContext = React.createContext(EMPTY_STATE);

export const VISIT_CHANNEL = 'VisitChannel';
export const TOAST_CHANNEL = 'ToastChannel';
export const VIEW_EVENT = 'pageView';

function NotificationsProvider(props) {
  // eslint-disable-next-line react/prop-types
  const { children } = props;
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [isInitialization, setIsInitialization] = useState(true);
  const history = useHistory();

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
      beginListening(dispatch, history);
      setIsInitialization(false);
    }
    return () => {
    };
  }, [isInitialization]);

  return (
    <NotificationsContext.Provider value={[state, dispatch]}>
      {children}
    </NotificationsContext.Provider>
  );
}

export { NotificationsContext, NotificationsProvider };
