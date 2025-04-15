import React, { useContext, useEffect, useReducer, useState } from 'react';
import reducer, { updateLeader } from './leaderContextReducer'
import { refreshNotifications, refreshVersions } from '../../api/versionedFetchUtils';
import { AccountContext } from '../AccountContext/AccountContext';
import { userIsLoaded } from '../AccountContext/accountUserContextHelper';
import { MarketsContext } from '../MarketsContext/MarketsContext';
import { MarketPresencesContext } from '../MarketPresencesContext/MarketPresencesContext';
import { MarketStagesContext } from '../MarketStagesContext/MarketStagesContext';
import { InvestiblesContext } from '../InvestibesContext/InvestiblesContext';
import { CommentsContext } from '../CommentsContext/CommentsContext';
import { MarketGroupsContext } from '../MarketGroupsContext/MarketGroupsContext';
import { GroupMembersContext } from '../GroupMembersContext/GroupMembersContext';
import { DiffContext } from '../DiffContext/DiffContext';
import { TicketIndexContext } from '../TicketContext/TicketIndexContext';
import { SearchIndexContext } from '../SearchIndexContext/SearchIndexContext';
import { isSignedOut, onSignOut } from '../../utils/userFunctions';
import { Tab } from 'tab-election';

const EMPTY_STATE = {
  leader: undefined,
};

const LeaderContext = React.createContext(EMPTY_STATE);

let leaderContextHack = {};
export { leaderContextHack };

function LeaderProvider(props) {
  const { children, authState, userId } = props;
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [userState] = useContext(AccountContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const [, marketStagesDispatch] = useContext(MarketStagesContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, commentsDispatch] = useContext(CommentsContext);
  const [, groupsDispatch] = useContext(MarketGroupsContext);
  const [, groupMembersDispatch] = useContext(GroupMembersContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, ticketsDispatch] = useContext(TicketIndexContext);
  const [index] = useContext(SearchIndexContext);
  const [myTab, setMyTab] = useState(new Tab('uclusion'));
  const isUserLoaded = userIsLoaded(userState);
  const { isLeader } = state;

  useEffect(() => {
    if (authState === 'signedIn' && userId) {
      myTab.addEventListener('message', (event) => {
        console.info('Received tab message: ', event.data);
        // Currently there is only one message can receive
        onSignOut().then(() => console.info('Done logging out'));
      });
      myTab.waitForLeadership(() => {
        if (isSignedOut()) {
          console.info('Logging out after seeing leadership change');
          onSignOut().then(() => console.info('Done logging out'));
        } else {
          console.info(`Claiming leadership`);
          // Could use broadcast ID to send message out to others to refresh out of login page
          // but its a bit risky as can somehow infinite refresh and corner of corner case anyway
          dispatch(updateLeader(true));
        }
      });
    }
    return () => {};
  }, [authState, myTab, setMyTab, userId]);

  useEffect(() => {
    if (authState !== 'signedIn') {
      console.info('Sending logout');
      myTab.send('logout');
      myTab.close();
      window.location.reload(true);
    }
  }, [authState, myTab]);

  useEffect(() => {
    if (isUserLoaded) {
      if (isLeader) {
        const dispatchers = { marketsDispatch, marketStagesDispatch, groupsDispatch, presenceDispatch,
          groupMembersDispatch, investiblesDispatch, commentsDispatch, diffDispatch, index, ticketsDispatch };
        console.info('Leadership refreshing versions');
        // Try use set timeout and dispatchers for stability but my have to move to suspend
        setTimeout(() => refreshVersions(dispatchers).then(() => {
          console.info('Refreshed versions from leader init');
        }).catch(() => console.warn('Error refreshing')), 0);
      } else {
        // Required to get initialized true in notifications context plus really don't need a leader for notifications
        refreshNotifications();
      }
    }
    return () => {};
  }, [isUserLoaded, isLeader, marketsDispatch, marketStagesDispatch, groupsDispatch, presenceDispatch,
    groupMembersDispatch, investiblesDispatch, commentsDispatch, diffDispatch, index, ticketsDispatch]);
  leaderContextHack = state;
  return (
    <LeaderContext.Provider value={[state, dispatch]}>
      {children}
    </LeaderContext.Provider>
  );
}

export { LeaderProvider, LeaderContext };
