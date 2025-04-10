import React, { useContext, useEffect, useReducer } from 'react';
import { waitForLeadership } from 'tab-election';
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

const EMPTY_STATE = {
  leader: undefined,
};

const LeaderContext = React.createContext(EMPTY_STATE);

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
  const isUserLoaded = userIsLoaded(userState);
  const { isLeader } = state;

  useEffect(() => {
    if (authState === 'signedIn' && userId) {
      waitForLeadership(() => {
        console.info(`Claiming leadership`);
        // Could use broadcast ID to send message out to others to refresh out of login page
        // but its a bit risky as can somehow infinite refresh and corner of corner case anyway
        dispatch(updateLeader(true));
      });
    }
    return () => {};
  }, [authState, userId]);

  useEffect(() => {
    if (isUserLoaded) {
      if (isLeader) {
        const dispatchers = { marketsDispatch, marketStagesDispatch, groupsDispatch, presenceDispatch,
          groupMembersDispatch, investiblesDispatch, commentsDispatch, diffDispatch, index, ticketsDispatch };
        console.info('Leadership refreshing versions');
        // Try use set timeout and dispatchers for stability but my have to move to suspend
        setTimeout(() => refreshVersions(true, dispatchers).then(() => {
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

  return (
    <LeaderContext.Provider value={[state, dispatch]}>
      {children}
    </LeaderContext.Provider>
  );
}

export { LeaderProvider, LeaderContext };
